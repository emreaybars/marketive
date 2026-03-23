/**
 * Widget API - Vercel Serverless Function
 * API Key Pattern - Token yerine basit UUID kullanımı
 * 
 * Endpoint'ler:
 * - GET /api/widget/data?api_key={uuid}
 * - POST /api/widget/check-contact
 * - POST /api/widget/spin
 * - POST /api/widget/view
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// GÜVENLİK: Environment variables zorunlu
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// API Key cache (30 dakika) - Max 10000 entry
const apiKeyCache = new Map<string, { shopId: string; shopUuid: string; expires: number }>();
const MAX_CACHE_SIZE = 10000;

// Rate limiting - Basit in-memory store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 100; // API Key başına 100 istek/dakika
const RATE_LIMIT_IP_MAX = 10; // IP başına 10 istek/dakika

// Input validasyon fonksiyonları
const validators = {
    email: (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
    },
    phone: (phone: string): boolean => {
        return /^[\+]?[\d\s\-\(\)]{10,20}$/.test(phone);
    },
    fullName: (name: string): boolean => {
        return name.length >= 2 && name.length <= 100 && /^[\p{L}\s\-'\.]+$/u.test(name);
    },
    userAgent: (ua: string): boolean => {
        return ua.length <= 500;
    },
    apiKey: (key: string): boolean => {
        return /^[a-f0-9\-]{36,}$/i.test(key);
    },
    prizeId: (id: string): boolean => {
        return /^[a-f0-9\-]{36,}$/i.test(id);
    }
};

// Rate limiting fonksiyonu
function checkRateLimit(identifier: string, maxRequests: number): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW
        });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

// Cache temizleme fonksiyonu
function cleanupCache() {
    if (apiKeyCache.size > MAX_CACHE_SIZE) {
        const now = Date.now();
        let deleted = 0;
        for (const [key, value] of apiKeyCache.entries()) {
            if (value.expires < now) {
                apiKeyCache.delete(key);
                deleted++;
            }
        }
        // Hala büyükse, en eski entry'leri sil
        if (apiKeyCache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(apiKeyCache.entries());
            entries.sort((a, b) => a[1].expires - b[1].expires);
            const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
            toDelete.forEach(([key]) => apiKeyCache.delete(key));
        }
    }
}

// API Key doğrulama - Rate limiting ve cache cleanup eklendi
async function verifyApiKey(apiKey: string, clientIp: string): Promise<{ shopId: string; shopUuid: string } | null> {
    try {
        // API Key format validasyonu
        if (!validators.apiKey(apiKey)) {
            return null;
        }

        // Rate limiting - API Key bazlı
        const rateKey = `api:${apiKey}`;
        if (!checkRateLimit(rateKey, RATE_LIMIT_MAX)) {
            return null;
        }

        // Rate limit map temizleme
        cleanupRateLimitMap();

        // Cache temizleme
        cleanupCache();

        // Cache kontrolü
        const cached = apiKeyCache.get(apiKey);
        if (cached && cached.expires > Date.now()) {
            return { shopId: cached.shopId, shopUuid: cached.shopUuid };
        }

        // Supabase'den shop bilgilerini al
        const { data: shop, error } = await supabase
            .from('shops')
            .select('id, shop_id')
            .eq('api_key', apiKey)
            .single();

        if (error || !shop) {
            return null;
        }

        // Cache'e ekle (30 dakika)
        apiKeyCache.set(apiKey, {
            shopId: shop.shop_id,
            shopUuid: shop.id,
            expires: Date.now() + 30 * 60 * 1000,
        });

        return { shopId: shop.shop_id, shopUuid: shop.id };
    } catch {
        return null;
    }
}

// CORS headers - Dinamik: Her shop'un kendi allowed_domains'ine göre
function setCorsHeaders(res: VercelResponse, req: VercelRequest, allowedDomains: string | null) {
    const origin = req.headers.origin;

    if (!origin) {
        // Origin header yoksa, credentials olmadan izin ver
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        // Domain validasyonu
        if (validateDomain(allowedDomains, origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
}

// Güvenilir client IP alma (x-forwarded-for son IP'si)
function getClientIp(req: VercelRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        // Son IP'yi al (en güvenilir)
        const ips = forwarded.split(',').map(ip => ip.trim());
        return ips[ips.length - 1] || 'unknown';
    }
    return req.socket.remoteAddress || 'unknown';
}

// Server-side ödül seçimi (ağırlıklı rastgele)
function selectPrizeServerSide(prizes: any[]): any | null {
    if (!prizes || prizes.length === 0) return null;

    // Toplam şansı hesapla
    const totalChance = prizes.reduce((sum, p) => sum + (p.chance || 0), 0);
    if (totalChance === 0) return prizes[0];

    // Rastgele sayı üret (0 ile totalChance arası)
    const random = Math.random() * totalChance;

    // Ağırlıklı seçim
    let current = 0;
    for (const prize of prizes) {
        current += prize.chance || 0;
        if (random <= current) {
            return prize;
        }
    }

    // Fallback - son ödül
    return prizes[prizes.length - 1];
}

// Domain doğrulama - Birleşik fonksiyon (CORS ve Referrer için)
function validateDomain(allowedDomains: string | null, url: string): boolean {
    if (!allowedDomains || allowedDomains === '[]' || allowedDomains === '') {
        return true; // Domain kısıtlaması yok
    }

    try {
        const domains: string[] = JSON.parse(allowedDomains);
        if (domains.length === 0) return true;

        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // Domain listesinde olup olmadığını kontrol et (www'li/www'sız her iki versiyon)
        return domains.some(domain => {
            const domainLower = domain.toLowerCase().replace(/^https?:\/\//, '');
            // Tam eşleşme veya subdomain kontrolü
            return hostname === domainLower ||
                hostname.endsWith('.' + domainLower) ||
                domainLower.endsWith('.' + hostname);
        });
    } catch {
        return false; // Güvenli varsayım: Parse hatasında reddet
    }
}

// Rate limit map temizleme (her saat)
let lastRateLimitCleanup = Date.now();
const RATE_LIMIT_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 saat

function cleanupRateLimitMap() {
    const now = Date.now();
    if (now - lastRateLimitCleanup > RATE_LIMIT_CLEANUP_INTERVAL) {
        for (const [key, value] of rateLimitMap.entries()) {
            if (now > value.resetTime) {
                rateLimitMap.delete(key);
            }
        }
        lastRateLimitCleanup = now;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // HTTPS zorlaması
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.status(403).json({ error: 'HTTPS required' });
    }

    if (req.method === 'OPTIONS') {
        // OPTIONS için basit CORS (preflight)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
        return res.status(200).end();
    }

    // Rate limiting - IP bazlı
    const clientIp = getClientIp(req);
    const ipKey = `ip:${clientIp}`;
    if (!checkRateLimit(ipKey, RATE_LIMIT_IP_MAX)) {
        return res.status(429).json({ error: 'Too many requests', retry_after: 60 });
    }

    const { path } = req.query;
    const endpoint = Array.isArray(path) ? path.join('/') : path;

    try {
        switch (endpoint) {
            case 'data':
                return await handleGetData(req, res);
            case 'check-contact':
                return await handleCheckContact(req, res);
            case 'spin':
                return await handleSpin(req, res);
            case 'view':
                return await handleView(req, res);
            default:
                return res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        // Production'da detaylı hata bilgisi sızdırma
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /api/widget/data
async function handleGetData(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = req.query.api_key as string;
    if (!apiKey) {
        return res.status(400).json({ error: 'api_key required' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const shopAuth = await verifyApiKey(apiKey, clientIp as string);
    if (!shopAuth) {
        return res.status(401).json({ error: 'Invalid api_key' });
    }

    // Shop bilgilerini getir
    const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopAuth.shopUuid)
        .single();

    if (shopError || !shop) {
        return res.status(404).json({ error: 'Shop not found' });
    }

    // Dinamik CORS - Shop'un allowed_domains'ine göre
    setCorsHeaders(res, req, shop.allowed_domains);

    // Domain doğrulama
    const referrer = req.headers.referer || '';

    // Domain kontrolü
    if (!validateDomain(shop.allowed_domains, referrer)) {
        return res.status(403).json({ error: 'Domain not authorized' });
    }

    // Widget ayarlarını getir
    const { data: widgetSettings } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('shop_id', shop.id)
        .single();

    const widget = widgetSettings || {
        title: 'Çarkı Çevir<br>Hediyeni Kazan!',
        description: 'Hediyeni almak için hemen çarkı çevir.',
        button_text: 'ÇARKI ÇEVİR',
        show_on_load: true,
        popup_delay: 2000,
        title_color: '#ffffff',
        description_color: '#ffffff'
    };

    // Ödülleri getir
    const { data: prizes, error: prizesError } = await supabase
        .from('prizes')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('active', true)
        .order('display_order', { ascending: true });

    if (prizesError || !prizes || prizes.length === 0) {
        return res.status(404).json({ error: 'No prizes found' });
    }

    return res.json({
        shop: {
            uuid: shop.id,
            name: shop.name,
            logo: shop.logo_url,
            url: shop.website_url,
            brandName: shop.brand_name,
            contactInfoType: shop.contact_info_type || 'email'
        },
        widget: {
            title: widget.title,
            description: widget.description,
            buttonText: widget.button_text,
            showOnLoad: widget.show_on_load,
            popupDelay: widget.popup_delay,
            backgroundColor: widget.background_color,
            buttonColor: widget.button_color,
            buttonTextColor: widget.button_text_color || '#ffffff',
            titleColor: widget.title_color,
            descriptionColor: widget.description_color,
            widgetPosition: widget.widget_position || 'middle-right'
        },
        prizes: prizes.map(prize => ({
            id: prize.id,
            name: prize.name,
            description: prize.description,
            color: prize.color,
            chance: prize.chance,
            url: prize.redirect_url,
            has_coupons: !!(prize.coupon_codes && prize.coupon_codes.trim().length > 0)
        }))
    });
}

// POST /api/widget/check-contact
async function handleCheckContact(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { api_key, contact } = req.body;
    if (!api_key || !contact) {
        return res.status(400).json({ error: 'api_key and contact required' });
    }

    const clientIp = getClientIp(req);
    const shopAuth = await verifyApiKey(api_key, clientIp);
    if (!shopAuth) {
        return res.status(401).json({ error: 'Invalid api_key' });
    }

    // Shop bilgilerini getir (CORS için)
    const { data: shop } = await supabase
        .from('shops')
        .select('allowed_domains')
        .eq('id', shopAuth.shopUuid)
        .single();

    setCorsHeaders(res, req, shop?.allowed_domains || null);

    // Email veya phone'a göre kontrol
    const isEmail = contact.includes('@');

    const { data: existing } = await supabase
        .from('wheel_spins')
        .select('id')
        .eq('shop_id', shopAuth.shopUuid)
        .filter(isEmail ? 'email' : 'phone', 'eq', isEmail ? contact.toLowerCase() : contact)
        .limit(1);

    return res.json({ exists: existing && existing.length > 0 });
}

// POST /api/widget/spin
async function handleSpin(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { api_key, prize_id, full_name, contact, user_agent } = req.body;
    if (!api_key || !contact) {
        return res.status(400).json({ error: 'api_key and contact required' });
    }

    // Input validasyonu
    if (full_name && !validators.fullName(full_name)) {
        return res.status(400).json({ error: 'Invalid full_name format' });
    }

    if (user_agent && !validators.userAgent(user_agent)) {
        return res.status(400).json({ error: 'Invalid user_agent' });
    }

    const clientIp = getClientIp(req);
    const shopAuth = await verifyApiKey(api_key, clientIp);
    if (!shopAuth) {
        return res.status(401).json({ error: 'Invalid api_key' });
    }

    // Shop bilgilerini getir (CORS için)
    const { data: shop } = await supabase
        .from('shops')
        .select('allowed_domains')
        .eq('id', shopAuth.shopUuid)
        .single();

    setCorsHeaders(res, req, shop?.allowed_domains || null);

    // SERVER-SIDE SPIN RATE LIMITING
    // NOT: check_spin_rate_limit fonksiyonu artık kayıt oluşturuyor
    const { data: rateCheck, error: rateError } = await supabase
        .rpc('check_spin_rate_limit', {
            p_shop_id: shopAuth.shopUuid,
            p_contact: contact,
            p_ip_address: clientIp,
            p_max_spins: 1,
            p_window_hours: 24
        });

    if (rateError) {
        console.error('Rate limit check error:', rateError);
        return res.status(500).json({ error: 'Rate limit check failed' });
    }

    if (!rateCheck || !rateCheck[0]?.can_spin) {
        return res.status(429).json({
            error: 'Spin limit reached',
            message: '24 saat içinde sadece 1 kez çark çevirebilirsiniz',
            time_until_reset: rateCheck?.[0]?.time_until_reset || 86400
        });
    }

    // SERVER-SIDE PRIZE SELECTION
    // Tüm aktif ödülleri getir
    const { data: prizes, error: prizesError } = await supabase
        .from('prizes')
        .select('*')
        .eq('shop_id', shopAuth.shopUuid)
        .eq('active', true);

    if (prizesError || !prizes || prizes.length === 0) {
        return res.status(404).json({ error: 'No active prizes found' });
    }

    // Ağırlıklı rastgele ödül seçimi (server-side)
    const selectedPrize = selectPrizeServerSide(prizes);
    if (!selectedPrize) {
        return res.status(500).json({ error: 'Prize selection failed' });
    }

    // Kupon kodunu al
    let couponCode = null;
    if (selectedPrize.coupon_codes) {
        const codes = selectedPrize.coupon_codes.split('\n').filter((c: string) => c.trim());

        // Atomik kupon seçimi - kullanılmamış ilk kuponu al
        for (const code of codes) {
            const trimmedCode = code.trim();
            // Bu kupon daha önce kullanılmış mı kontrol et
            const { data: existingCoupon } = await supabase
                .from('wheel_wins')
                .select('id')
                .eq('shop_id', shopAuth.shopUuid)
                .eq('coupon_code', trimmedCode)
                .limit(1);

            if (!existingCoupon || existingCoupon.length === 0) {
                couponCode = trimmedCode;
                break;
            }
        }

        // Tüm kuponlar kullanılmışsa, kupon olmadan devam et
        if (!couponCode && codes.length > 0) {
            console.warn(`All coupons used for shop ${shopAuth.shopUuid}`);
        }
    }

    // Email mi telefon mu kontrol et
    const isEmail = contact.includes('@');

    // Spin kaydı oluştur (server-side seçilen ödül ile)
    const { data: spin, error: spinError } = await supabase
        .from('wheel_spins')
        .insert({
            shop_id: shopAuth.shopUuid,
            email: isEmail ? contact.toLowerCase() : null,
            phone: isEmail ? null : contact,
            full_name: full_name || null,
            result: selectedPrize.name,
            prize_type: selectedPrize.name,
            prize_value: couponCode,
            coupon_code: couponCode,
            prize_name: selectedPrize.name,
            ip_address: clientIp,
            user_agent: user_agent || req.headers['user-agent'],
            session_id: null
        })
        .select()
        .single();

    if (spinError) {
        console.error('Spin insert error:', spinError);
        return res.status(500).json({ error: 'Failed to log spin' });
    }

    // Won prize kaydı oluştur
    await supabase
        .from('won_prizes')
        .insert({
            shop_id: shopAuth.shopUuid,
            prize_id: selectedPrize.id,
            email: isEmail ? contact.toLowerCase() : null,
            phone: isEmail ? null : contact,
            coupon_code: couponCode
        });

    // Wheel wins kaydı oluştur
    await supabase
        .from('wheel_wins')
        .insert({
            shop_id: shopAuth.shopUuid,
            spin_id: spin.id,
            prize_id: selectedPrize.id,
            coupon_code: couponCode,
            claimed: false
        });

    return res.json({
        status: 'success',
        spin_id: spin.id,
        prize: {
            id: selectedPrize.id,
            name: selectedPrize.name,
            description: selectedPrize.description,
            color: selectedPrize.color,
            url: selectedPrize.redirect_url
        },
        coupon_code: couponCode,
        remaining_spins: rateCheck?.[0]?.remaining_spins || 0
    });
}

// POST /api/widget/view
async function handleView(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { api_key, user_agent, referrer } = req.body;
    if (!api_key) {
        return res.status(400).json({ error: 'api_key required' });
    }

    if (user_agent && !validators.userAgent(user_agent)) {
        return res.status(400).json({ error: 'Invalid user_agent' });
    }

    const clientIp = getClientIp(req);
    const shopAuth = await verifyApiKey(api_key, clientIp);
    if (!shopAuth) {
        return res.status(401).json({ error: 'Invalid api_key' });
    }

    // Shop bilgilerini getir (CORS için)
    const { data: shop } = await supabase
        .from('shops')
        .select('allowed_domains')
        .eq('id', shopAuth.shopUuid)
        .single();

    setCorsHeaders(res, req, shop?.allowed_domains || null);

    await supabase
        .from('widget_views')
        .insert({
            shop_id: shopAuth.shopUuid,
            ip_address: clientIp,
            user_agent: user_agent || req.headers['user-agent'],
            referrer: referrer || req.headers.referer || null
        });

    return res.json({ status: 'success' });
}