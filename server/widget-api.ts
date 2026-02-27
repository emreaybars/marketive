/**
 * Widget API Server
 * Secure API endpoints for the Çarkıfelek widget
 * This server acts as a proxy, keeping Supabase credentials secure
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.WIDGET_API_PORT || 3001;

// Initialize Supabase with service role key (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://qiiygcclanmgzlrcpmle.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'
);

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
    .createHmac('sha256', process.env.WIDGET_SECRET || 'default-secret-change-me')
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

    // Verify signature
    const { sig, ...data } = payload;
    const payloadStr = JSON.stringify(data);
    const expectedSig = crypto
      .createHmac('sha256', process.env.WIDGET_SECRET || 'default-secret-change-me')
      .update(payloadStr)
      .digest('hex');

    if (sig !== expectedSig) {
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
      coupons: prize.coupon_codes ? prize.coupon_codes.split('\n').filter(c => c.trim()) : [],
      url: prize.redirect_url,
      color: prize.color,
      chance: prize.chance
    }));

    res.json({
      shop: {
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
      const codes = prize.coupon_codes.split('\n').filter(c => c.trim());
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

// Health check
app.get('/api/widget/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
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
