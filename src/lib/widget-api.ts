/**
 * Shop Token Generator for Widget Embed Security
 * Each shop gets a unique token that is used instead of exposing Supabase keys
 * GÜVENLİK: HMAC-SHA256 signed tokens for production use
 * 
 * NOT: Bu dosya sadece Node.js ortamında çalıştırılmalıdır!
 * Asla browser'a göndermeyin - SERVICE_ROLE_KEY içerir.
 */

import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

// GÜVENLİK: Environment variables zorunlu - fallback yok
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WIDGET_SECRET = process.env.WIDGET_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required. ' +
    'These should only be available in secure backend environments.'
  );
}

if (!WIDGET_SECRET) {
  throw new Error('WIDGET_SECRET environment variable is required');
}

// Type assertion after validation
const VALIDATED_WIDGET_SECRET: string = WIDGET_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface ShopTokenPayload {
  sid: string;      // The public shop_id (VARCHAR)
  uid: string;      // The internal UUID
  ts: number;
  sig: string;      // HMAC signature
}

/**
 * Generate a secure token for a shop with HMAC signature
 * This token is embedded in the widget code and used to authenticate requests
 */
export async function generateShopToken(shopId: string): Promise<string> {
  const { data: shop } = await supabase
    .from('shops')
    .select('id, shop_id')
    .eq('shop_id', shopId)
    .single();

  if (!shop) {
    throw new Error('Shop not found');
  }

  const payload = {
    sid: shop.shop_id,
    uid: shop.id,
    ts: Date.now(),
  };

  const payloadStr = JSON.stringify(payload);
  const signature = createHmac('sha256', VALIDATED_WIDGET_SECRET)
    .update(payloadStr)
    .digest('hex');

  const tokenPayload = { ...payload, sig: signature };
  return Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
}

/**
 * Verify a shop token and return the shop UUID
 * GÜVENLİK: Validates HMAC signature to prevent token forgery
 */
export function verifyShopToken(token: string): { shopId: string; shopUuid: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString()) as ShopTokenPayload;

    // GÜVENLİK: Token expiry kontrolü (5 dakika)
    const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika
    if (!payload.ts || Date.now() - payload.ts > TOKEN_EXPIRY_MS) {
      return null; // Token expired
    }

    // Verify signature
    const { sig, ...data } = payload;
    const payloadStr = JSON.stringify(data);
    const expectedSig = createHmac('sha256', VALIDATED_WIDGET_SECRET)
      .update(payloadStr)
      .digest('hex');

    // GÜVENLİK: Timing-safe comparison ile timing attack'leri önle
    const sigBuffer = Buffer.from(sig);
    const expectedSigBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedSigBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      return null;
    }

    return {
      shopId: data.sid,
      shopUuid: data.uid,
    };
  } catch {
    return null;
  }
}

/**
 * Generate embed code for a shop
 */
export async function generateEmbedCode(shopId: string, domain: string): Promise<{
  html: string;
  token: string;
}> {
  const token = await generateShopToken(shopId);

  const html = `<script id="carkifelek-widget-script"
  data-shop-token="${token}"
  src="${domain}/widget.js">
</script>`;

  return { html, token };
}

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
