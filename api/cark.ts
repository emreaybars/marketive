/**
 * Çark API - Vercel Serverless Function
 * Entegrasyon ve sipariş senkronizasyonu için
 *
 * Endpoint'ler:
 * - POST /api/cark/test-integration
 * - POST /api/cark/sync-orders
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// GÜVENLİK: Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JWT_SECRET = process.env.JWT_SECRET || 'marketive-secret-2024';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
function setCorsHeaders(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    setCorsHeaders(res);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { path } = req.query;
    const endpoint = Array.isArray(path) ? path.join('/') : path;

    try {
        switch (endpoint) {
            case 'test-integration':
                return await handleTestIntegration(req, res);
            case 'sync-orders':
                return await handleSyncOrders(req, res);
            default:
                return res.status(404).json({ error: 'Not found' });
        }
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

// POST /api/cark/test-integration
async function handleTestIntegration(req: VercelRequest, res: VercelResponse) {
    const { username, password, storeName } = req.body;

    if (!username || !password || !storeName) {
        return res.status(400).json({ success: false, error: 'Kullanıcı adı, şifre ve mağaza adı gereklidir' });
    }

    try {
        // ButikSistem API'sine istek at
        const apiUrl = 'https://test.butiksistem.com/rest/order/get';

        const now = new Date();
        const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + ' 00:00';
        const endTime = now.toISOString().slice(0, 10) + ' 23:59';

        const apiRequestBody = {
            auth: {
                userName: username,
                password: password
            },
            arguments: {
                storeName: storeName,
                startTime: startTime,
                endTime: endTime
            }
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiRequestBody)
        });

        if (!apiResponse.ok) {
            throw new Error(`API yanıt hatası: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        return res.json({
            success: true,
            data: data,
            message: 'Bağlantı testi başarılı'
        });
    } catch (error: any) {
        console.error('Test integration error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Bağlantı testi başarısız'
        });
    }
}

// POST /api/cark/sync-orders
async function handleSyncOrders(req: VercelRequest, res: VercelResponse) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
    }

    // Bearer token'dan kullanıcı ID'sini al
    const token = authorization.replace('Bearer ', '');

    try {
        // Supabase ile token'ı doğrula
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ success: false, error: 'Geçersiz token' });
        }

        const userId = user.id;

        // Kullanıcının entegrasyon bilgilerini al
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('id')
            .eq('customer_id', userId)
            .limit(1);

        if (shopsError || !shops || shops.length === 0) {
            return res.status(404).json({ success: false, error: 'Mağaza bulunamadı' });
        }

        const firstShopId = shops[0].id;

        // Entegrasyon bilgilerini al
        const { data: integration, error: integrationError } = await supabase
            .from('shop_integrations')
            .select('*')
            .eq('shop_id', firstShopId)
            .eq('platform_type', 'custom')
            .single();

        if (integrationError || !integration) {
            return res.status(404).json({ success: false, error: 'Entegrasyon bulunamadı' });
        }

        // API bilgilerini kullan (server-side, frontend'de gizli)
        const apiUsername = integration.api_username || '';
        let apiPassword = integration.api_password || '';

        // Password şifre çözme (sadece password şifreli)
        if (apiPassword && apiPassword.length > 50) {
            try {
                const { data: decryptResult } = await supabase
                    .rpc('decrypt_api_password', { encrypted_text: apiPassword });
                if (decryptResult && typeof decryptResult === 'string' && decryptResult.length > 0) {
                    apiPassword = decryptResult;
                }
            } catch (e) {
                // Password düz metin kullanılır
            }
        }

        const storeName = integration.store_name || 'test';

        // ButikSistem API'sine istek at
        const apiUrl = 'https://test.butiksistem.com/rest/order/get';

        const now = new Date();
        const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + ' 00:00';
        const endTime = now.toISOString().slice(0, 10) + ' 23:59';

        const apiRequestBody = {
            auth: {
                userName: apiUsername,
                password: apiPassword
            },
            arguments: {
                storeName: storeName,
                startTime: startTime,
                endTime: endTime
            }
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiRequestBody)
        });

        if (!apiResponse.ok) {
            throw new Error(`API yanıt hatası: ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        const orders = apiData.data || [];

        let recordsUpdated = 0;
        let matchesFound = 0;

        // Siparişleri wheel_spins ile eşleştir
        for (const order of orders) {
            const orderEmail = order.orderEmail?.toLowerCase()?.trim();
            const orderAmount = order.orderProductsValue || 0;
            const orderDate = order.orderDateTime ? new Date(order.orderDateTime).toISOString() : null;

            if (!orderEmail) continue;

            // Eşleşen spin kaydı var mı kontrol et
            const { data: existingSpin } = await supabase
                .from('wheel_spins')
                .select('id, order_amount, order_date')
                .eq('shop_id', firstShopId)
                .eq('email', orderEmail)
                .maybeSingle();

            if (existingSpin) {
                matchesFound++;

                // order_amount veya order_date boşsa güncelle
                const needsUpdate =
                    (!existingSpin.order_amount || existingSpin.order_amount === 0) ||
                    (!existingSpin.order_date && orderDate);

                if (needsUpdate) {
                    const { error: updateError } = await supabase
                        .from('wheel_spins')
                        .update({
                            order_amount: orderAmount,
                            order_date: orderDate || existingSpin.order_date
                        })
                        .eq('id', existingSpin.id);

                    if (!updateError) {
                        recordsUpdated++;
                    }
                }
            }
        }

        // Entegrasyon durumunu güncelle
        await supabase
            .from('shop_integrations')
            .update({
                last_sync_at: new Date().toISOString(),
                sync_status: 'success',
                error_message: null
            })
            .eq('id', integration.id);

        return res.json({
            success: true,
            data: {
                ordersFetched: orders.length,
                matchesFound: matchesFound,
                recordsUpdated: recordsUpdated
            }
        });
    } catch (error: any) {
        console.error('Sync orders error:', error);

        // Hata durumunda entegrasyon durumunu güncelle
        try {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                const { data: shops } = await supabase
                    .from('shops')
                    .select('id')
                    .eq('customer_id', user.id)
                    .limit(1);

                if (shops && shops.length > 0) {
                    await supabase
                        .from('shop_integrations')
                        .update({
                            sync_status: 'failed',
                            error_message: error.message || 'Senkronizasyon hatası'
                        })
                        .eq('shop_id', shops[0].id)
                        .eq('platform_type', 'custom');
                }
            }
        } catch (e) {
            // Güncelleme hatasını yoksay
        }

        return res.status(500).json({
            success: false,
            error: error.message || 'Senkronizasyon başarısız'
        });
    }
}
