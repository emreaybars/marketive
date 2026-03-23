/**
 * Widget API Server
 * Secure API endpoints for the Çarkıfelek widget
 * This server acts as a proxy, keeping Supabase credentials secure
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.WIDGET_API_PORT || 3001;

// GÜVENLİK: Environment variables zorunlu - hardcoded fallback'ler kaldırıldı
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WIDGET_SECRET = process.env.WIDGET_SECRET!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required'
  );
}

if (!WIDGET_SECRET) {
  throw new Error('WIDGET_SECRET environment variable is required');
}

// Initialize Supabase with service role key (server-side only)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (widget.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

// Cache for shop token validation (5 minute TTL)
const tokenCache = new Map<string, { shopId: string; shopUuid: string; expires: number }>();

/**
 * Generate a secure token for a shop
 * Called when creating/editing a shop in the admin panel
 */
export function generateShopToken(shopId: string, shopUuid: string): string {
  const payload = {
    sid: shopId,      // Public shop_id
    uid: shopUuid,    // Internal UUID
    ts: Date.now(),   // Timestamp
  };

  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', WIDGET_SECRET)
    .update(payloadStr)
    .digest('hex');

  return Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64url');
}

/**
 * Verify and decode a shop token
 */
function verifyShopToken(token: string): { shopId: string; shopUuid: string } | null {
  try {
    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && cached.expires > Date.now()) {
      return { shopId: cached.shopId, shopUuid: cached.shopUuid };
    }

    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());

    // GÜVENLİK: Token expiry kontrolü (5 dakika)
    const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika
    if (!payload.ts || Date.now() - payload.ts > TOKEN_EXPIRY_MS) {
      return null; // Token expired
    }

    // Verify signature
    const { sig, ...data } = payload;
    const payloadStr = JSON.stringify(data);
    const expectedSig = crypto
      .createHmac('sha256', WIDGET_SECRET)
      .update(payloadStr)
      .digest('hex');

    // GÜVENLİK: Timing-safe comparison ile timing attack'leri önle
    const sigBuffer = Buffer.from(sig);
    const expectedSigBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedSigBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      return null;
    }

    // Cache the result
    tokenCache.set(token, {
      shopId: data.sid,
      shopUuid: data.uid,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return { shopId: data.sid, shopUuid: data.uid };
  } catch {
    return null;
  }
}

/**
 * GET /api/widget/data?token={shopToken}
 * Get widget configuration, shop info, and prizes
 */
app.get('/api/widget/data', async (req, res) => {
  try {
    const token = req.query.token as string;
    const referrer = req.headers.referer || '';

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get shop info
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopAuth.shopUuid)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Domain validation (optional, based on shop settings)
    if (shop.allowed_domains) {
      const allowedDomains = JSON.parse(shop.allowed_domains || '[]');
      if (allowedDomains.length > 0) {
        try {
          const refUrl = new URL(referrer);
          const referrerDomain = refUrl.hostname.toLowerCase();
          if (!allowedDomains.includes(referrerDomain)) {
            // Allow for development or if direct=1
            if (req.query.direct !== '1') {
              return res.status(403).json({ error: 'Domain not authorized' });
            }
          }
        } catch {
          // Invalid referrer, continue
        }
      }
    }

    // Get widget settings
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

    // Get active prizes
    const { data: prizes, error: prizesError } = await supabase
      .from('prizes')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (prizesError || !prizes || prizes.length === 0) {
      return res.status(404).json({ error: 'No prizes found' });
    }

    // Format prizes
    const formattedPrizes = prizes.map(prize => ({
      id: prize.id,
      name: prize.name,
      description: prize.description,
      coupons: prize.coupon_codes ? prize.coupon_codes.split('\n').filter((c: string) => c.trim()) : [],
      url: prize.redirect_url,
      color: prize.color,
      chance: prize.chance
    }));

    res.json({
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
        titleColor: widget.title_color,
        descriptionColor: widget.description_color
      },
      prizes: formattedPrizes
    });

  } catch (error) {
    console.error('Widget data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/widget/check-email
 * Check if email has already won
 */
app.post('/api/widget/check-email', async (req, res) => {
  try {
    const token = req.body.token;
    const { email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: existingPrize } = await supabase
      .from('won_prizes')
      .select('id')
      .eq('shop_id', shopAuth.shopUuid)
      .eq('email', email.toLowerCase())
      .limit(1);

    const exists = existingPrize && existingPrize.length > 0;

    res.json({ status: 'success', exists });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/widget/log-spin
 * Log a winning spin
 */
app.post('/api/widget/log-spin', async (req, res) => {
  try {
    const token = req.body.token;
    const { prize_id, email, session_id } = req.body;

    if (!token || !prize_id) {
      return res.status(400).json({ error: 'Token and prize_id required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get prize info
    const { data: prize } = await supabase
      .from('prizes')
      .select('*')
      .eq('id', prize_id)
      .eq('shop_id', shopAuth.shopUuid)
      .single();

    if (!prize) {
      return res.status(404).json({ error: 'Prize not found' });
    }

    // Get coupon code
    let couponCode = req.body.coupon_code;
    if (!couponCode && prize.coupon_codes) {
      const codes = prize.coupon_codes.split('\n').filter((c: string) => c.trim());
      couponCode = codes[0] || null;
    }

    // Insert won_prizes record
    const { data: wonPrize, error: insertError } = await supabase
      .from('won_prizes')
      .insert({
        shop_id: shopAuth.shopUuid,
        prize_id: prize.id,
        email: email?.toLowerCase(),
        coupon_code: couponCode
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to log prize' });
    }

    // Log wheel_spins
    await supabase
      .from('wheel_spins')
      .insert({
        shop_id: shopAuth.shopUuid,
        email: email?.toLowerCase(),
        result: prize.name,
        prize_type: prize.name,
        prize_value: couponCode,
        coupon_code: couponCode,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        session_id: session_id || null
      });

    res.json({
      status: 'success',
      message: 'Prize logged successfully',
      won_prize_id: wonPrize.id
    });

  } catch (error) {
    console.error('Log spin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/widget/view
 * Track widget view (optional, for analytics)
 */
app.post('/api/widget/view', async (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await supabase
      .from('widget_views')
      .insert({
        shop_id: shopAuth.shopUuid,
        session_id: req.body.session_id || null,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers.referer || null
      });

    res.json({ status: 'success' });

  } catch (error) {
    // Don't fail on tracking errors
    res.json({ status: 'success' });
  }
});

// ============================================
// WIDGET.JS v7.0 İÇİN YENİ ROUTE'LAR
// ============================================

/**
 * GET /data?token={shopToken}
 * Widget.js v7.0 için kısa route
 */
app.get('/data', async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Shop bilgilerini getir
    const { data: shop } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopAuth.shopUuid)
      .single();

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
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
    const { data: prizes } = await supabase
      .from('prizes')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (!prizes || prizes.length === 0) {
      return res.status(404).json({ error: 'No prizes found' });
    }

    res.json({
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
        titleColor: widget.title_color,
        descriptionColor: widget.description_color
      },
      prizes: prizes.map(prize => ({
        id: prize.id,
        name: prize.name,
        description: prize.description,
        color: prize.color,
        chance: prize.chance,
        url: prize.redirect_url,
        coupons: prize.coupon_codes ? prize.coupon_codes.split('\n').filter((c: string) => c.trim()) : []
      }))
    });
  } catch (error) {
    console.error('Widget data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /check-contact
 * İletişim bilgisinin daha önce kullanılıp kullanılmadığını kontrol et
 */
app.post('/check-contact', async (req, res) => {
  try {
    const { token, contact } = req.body;

    if (!token || !contact) {
      return res.status(400).json({ error: 'Token and contact required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Email veya phone'a göre kontrol
    const isEmail = contact.includes('@');
    const query = isEmail
      ? { shop_id: shopAuth.shopUuid, email: contact.toLowerCase() }
      : { shop_id: shopAuth.shopUuid, phone: contact };

    const { data: existing } = await supabase
      .from('wheel_spins')
      .select('id')
      .match(query)
      .limit(1);

    res.json({ exists: existing && existing.length > 0 });
  } catch (error) {
    console.error('Check contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /spin
 * Çark çevirme kaydı
 */
app.post('/spin', async (req, res) => {
  try {
    const { token, prize_id, full_name, contact, user_agent } = req.body;

    if (!token || !prize_id || !contact) {
      return res.status(400).json({ error: 'Token, prize_id and contact required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Ödül bilgilerini getir
    const { data: prize } = await supabase
      .from('prizes')
      .select('*')
      .eq('id', prize_id)
      .eq('shop_id', shopAuth.shopUuid)
      .single();

    if (!prize) {
      return res.status(404).json({ error: 'Prize not found' });
    }

    // SERVER-SIDE SPIN RATE LIMITING
    const clientIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
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

    // Kupon kodunu al
    let couponCode = null;
    if (prize.coupon_codes) {
      const codes = prize.coupon_codes.split('\n').filter((c: string) => c.trim());
      couponCode = codes[0] || null;
    }

    // Email mi telefon mu kontrol et
    const isEmail = contact.includes('@');

    // Spin kaydı oluştur
    const { data: spin, error: spinError } = await supabase
      .from('wheel_spins')
      .insert({
        shop_id: shopAuth.shopUuid,
        email: isEmail ? contact.toLowerCase() : null,
        phone: isEmail ? null : contact,
        full_name: full_name || null,
        result: prize.name,
        prize_type: prize.name,
        prize_value: couponCode,
        coupon_code: couponCode,
        ip_address: req.ip,
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
        prize_id: prize.id,
        email: isEmail ? contact.toLowerCase() : null,
        phone: isEmail ? null : contact,
        coupon_code: couponCode
      });

    res.json({
      status: 'success',
      spin_id: spin.id,
      coupon_code: couponCode
    });

  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /view
 * Widget görüntüleme kaydı
 */
app.post('/view', async (req, res) => {
  try {
    const { token, user_agent, referrer } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const shopAuth = verifyShopToken(token);
    if (!shopAuth) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await supabase
      .from('widget_views')
      .insert({
        shop_id: shopAuth.shopUuid,
        ip_address: req.ip,
        user_agent: user_agent || req.headers['user-agent'],
        referrer: referrer || req.headers.referer || null
      });

    res.json({ status: 'success' });

  } catch (error) {
    // Tracking hatalarını görmezden gel
    res.json({ status: 'success' });
  }
});

// Health check
app.get('/api/widget/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ============================================
// ÇARK ADMIN API - Entegrasyon Testi
// ============================================

/**
 * POST /api/cark/test-integration
 * ButikSistem API bağlantısını test et
 */
app.post('/api/cark/test-integration', async (req, res) => {
  try {
    const { username, password, storeName } = req.body;

    // Validasyon
    if (!username || !password || !storeName) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı, şifre ve mağaza adı gereklidir'
      });
    }

    // ButikSistem API URL'i - storeName subdomain olarak kullanılır
    const apiUrl = `https://${storeName}.butiksistem.com/rest/product/get`;

    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Format: YYYY-MM-DD HH:MM
    // Son 30 gün
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} 00:00`;
    const endDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 23:59`;

    const apiRequestBody = {
      auth: {
        userName: username,
        password: password
      },
      arguments: {},
      responseType: "json"
    };

    console.log('Test Integration: Store:', storeName);
    console.log('Test Integration: User:', username);
    // Şifre log'larda görülmesin

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiRequestBody)
    });

    console.log('Test Integration API Status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('Test Integration Error:', errorText);
      return res.status(500).json({
        success: false,
        error: 'API bağlantı hatası',
        details: errorText
      });
    }

    const data = await apiResponse.json();
    console.log('Test Integration: Success, orders:', data.result?.total || 0);

    // API yanıtını döndür
    if (data.status === false) {
      // ButikSistem hata mesajlarını Türkçe'ye çevir
      const errorMessages: Record<string, string> = {
        'ServiceUserNotFound': 'Kullanıcı adı veya şifre hatalı',
        'InvalidCredentials': 'Kullanıcı adı veya şifre hatalı',
        'StoreNotFound': 'Mağaza bulunamadı',
        'Unauthorized': 'Yetkilendirme hatası',
        'startTimeArgFormatNotValid': 'Başlangıç tarihi formatı hatalı'
      };

      return res.json({
        success: false,
        data: null,
        error: errorMessages[data.error] || data.error || 'API yanıt hatası'
      });
    }

    res.json({
      success: true,
      data: data.result || null,
      error: null
    });

  } catch (error: any) {
    console.error('Test integration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Test işlemi başarısız'
    });
  }
});

/**
 * POST /api/cark/sync-orders
 * ButikSistem API'sinden siparişleri senkronize et
 */
app.post('/api/cark/sync-orders', async (req, res) => {
  try {
    const { shopId, startDate: reqStartDate, endDate: reqEndDate } = req.body;

    // Auth header'dan token'ı al (isteğe bağlı, güvenlik için)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    // Token ile kullanıcının shop'una erişimi kontrol et
    // (Basit bir implementasyon - gerçek uygulamada Supabase auth kontrolü yapılmalı)
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, customer_id')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    // Shop entegrasyon bilgilerini al
    const { data: integration, error: integrationError } = await supabase
      .from('shop_integrations')
      .select('*')
      .eq('shop_id', shopId)
      .eq('platform_type', 'custom')
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    // ButikSistem API'sine istek at - storeName subdomain olarak kullanılır
    const apiUrl = `https://${integration.store_name}.butiksistem.com/rest/order/get`;

    const now = new Date();
    const calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const calculatedStartDate = new Date(calculatedEndDate.getTime() - 29 * 24 * 60 * 60 * 1000);

    // ButikSistem API formatı: YYYY-MM-DD (saat yok)
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // İstekteki tarihleri kullan veya varsayılan hesapla
    const startDateStr = reqStartDate ? formatDate(new Date(reqStartDate)) : formatDate(calculatedStartDate);
    const endDateStr = reqEndDate ? formatDate(new Date(reqEndDate)) : formatDate(calculatedEndDate);

    // API bilgilerini kullan (server-side, frontend'de gizli)
    // Username düz metin, Password şifreli olabilir (çözme ile)
    const apiUsername = integration.api_username || '';
    let apiPassword = integration.api_password || '';

    // Password şifre çözme (sadece password şifreli)
    if (apiPassword && apiPassword.length > 50) {
      try {
        const { data: decryptResult } = await supabase
          .rpc('decrypt_api_password', { encrypted_text: apiPassword });
        if (decryptResult && typeof decryptResult === 'string' && decryptResult.length > 0) {
          apiPassword = decryptResult;
          console.log('✅ Password şifre çözüldü');
        } else {
          console.log('ℹ️ Password düz metin kullanılıyor');
        }
      } catch (e) {
        console.log('ℹ️ Password düz metin kullanılıyor');
      }
    }

    const apiRequestBody = {
      auth: {
        userName: apiUsername,
        password: apiPassword
      },
      arguments: {
        startTime: startDateStr,
        endTime: endDateStr
      },
      responseType: "json"
    };

    console.log('Sync Orders API URL:', apiUrl);
    console.log('Sync Orders: Store:', integration.store_name);
    console.log('Sync Orders: Fetching orders from', startDateStr, 'to', endDateStr);

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiRequestBody)
    });

    console.log('Sync Orders API Status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('Sync Orders API Error:', errorText);
      return res.status(500).json({ success: false, error: 'ButikSistem API error', details: errorText });
    }

    const butikData = await apiResponse.json();
    console.log('Sync Orders: Response received, orders:', butikData.result?.data?.length || 0);

    if (!butikData.status || !butikData.result?.data) {
      return res.status(500).json({ success: false, error: 'Invalid API response' });
    }

    if (!butikData.status || !butikData.result?.data) {
      return res.status(500).json({ success: false, error: 'Invalid API response structure' });
    }

    const orders = butikData.result.data;

    console.log(`📦 Total orders fetched: ${orders.length}`);
    console.log('Sample order (first):', JSON.stringify(orders[0], null, 2));

    // Bu shop'a ait wheel_spins'leri al
    const { data: wheelSpins, error: spinsError } = await supabase
      .from('wheel_spins')
      .select('id, email, phone, created_at')
      .eq('shop_id', shopId);

    if (spinsError) {
      return res.status(500).json({ success: false, error: 'Failed to fetch wheel spins' });
    }

    console.log(`🎰 Total wheel_spins: ${wheelSpins?.length || 0}`);
    if (wheelSpins && wheelSpins.length > 0) {
      console.log('Sample wheel_spins (first 3):', JSON.stringify(wheelSpins.slice(0, 3), null, 2));
    }

    // Siparişleri wheel_spins ile eşleştir
    const matches: Array<{
      spinId: string;
      orderId: number;
      orderAmount: number;
      matchType: string;
    }> = [];

    for (const order of orders) {
      const orderPhone = order.deliveryPhone || order.billingPhone;
      const orderEmail = order.orderEmail;
      const orderDateTime = new Date(order.orderDateTime);

      // Her wheel spin ile kontrol et
      for (const spin of wheelSpins || []) {
        const spinDateTime = new Date(spin.created_at);

        // Sipariş tarihi spin tarihinden sonra olmalı
        if (orderDateTime < spinDateTime) continue;

        // Telefon ile eşleştirme
        const spinPhone = spin.phone?.replace(/\D/g, '');
        const cleanOrderPhone = orderPhone?.replace(/\D/g, '');

        // Email veya telefon ile eşleştirme
        const emailMatch = spin.email && orderEmail && spin.email.toLowerCase() === orderEmail.toLowerCase();
        const phoneMatch = spinPhone && cleanOrderPhone && (spinPhone === cleanOrderPhone || spinPhone.endsWith(cleanOrderPhone));

        if (emailMatch || phoneMatch) {
          matches.push({
            spinId: spin.id,
            orderId: order.id,
            orderAmount: order.orderAmount,
            orderDate: order.orderDateTime,
            matchType: emailMatch ? 'email' : 'phone'
          });
          console.log(`✅ Match found! Order #${order.id} - Spin #${spin.id} - ${emailMatch ? 'email' : 'phone'}`);
          break;
        }
      }
    }

    console.log(`🔗 Total matches found: ${matches.length}`);

    // OPTIMIZATION: Bulk update wheel_spins table directly with order_amount
    // 1. Get all spin_ids from matches
    const matchSpinIds = matches.map(m => m.spinId);
    console.log(`📋 Fetching wheel_spins for ${matchSpinIds.length} matches...`);

    // 2. Fetch current wheel_spins records to check which ones need updating
    const { data: existingSpins, error: existingSpinsError } = await supabase
      .from('wheel_spins')
      .select('id, order_amount')
      .in('id', matchSpinIds);

    if (existingSpinsError) {
      console.error('Error fetching wheel_spins:', existingSpinsError);
    }

    // Create a map for quick lookup
    const spinsMap = new Map<string, { order_amount: number }>();
    (existingSpins || []).forEach(spin => {
      spinsMap.set(spin.id, { order_amount: spin.order_amount || 0 });
    });

    console.log(`📊 Found ${spinsMap.size} wheel_spins records`);

    // 3. Prepare bulk update data (only for spins that need updating)
    const updates: Array<{ spinId: string; orderAmount: number }> = [];
    for (const match of matches) {
      const existing = spinsMap.get(match.spinId);
      // Only update if order_amount is 0 or null
      if (!existing || !existing.order_amount || existing.order_amount === 0) {
        updates.push({
          spinId: match.spinId,
          orderAmount: match.orderAmount,
          orderDate: match.orderDate
        });
      }
    }

    console.log(`📝 Will update ${updates.length} wheel_spins records...`);

    // 4. Perform bulk updates
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from('wheel_spins')
        .update({
          order_amount: update.orderAmount,
          order_date: update.orderDate
        })
        .eq('id', update.spinId);

      if (!error) {
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} wheel_spins records`);

    // Sync status güncelle
    await supabase
      .from('shop_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'success',
        error_message: null
      })
      .eq('id', integration.id);

    res.json({
      success: true,
      data: {
        ordersFetched: orders.length,
        matchesFound: matches.length,
        recordsUpdated: updatedCount,
        lastSyncAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Sync orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Widget API running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /api/widget/data`);
  console.log(`   POST /api/widget/check-email`);
  console.log(`   POST /api/widget/log-spin`);
  console.log(`   POST /api/widget/view`);
});

export { app };
