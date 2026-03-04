/**
 * Shop Token Generator for Widget Embed Security
 * Each shop gets a unique token that is used instead of exposing Supabase keys
 * GÜVENLİK: HMAC-SHA256 signed tokens for production use
 */

import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GÜVENLİK: WIDGET_SECRET must be set
const WIDGET_SECRET = import.meta.env.WIDGET_SECRET;
if (!WIDGET_SECRET) {
  throw new Error('WIDGET_SECRET environment variable is required');
}

export interface ShopTokenPayload {
  shop_id: string;  // The public shop_id (VARCHAR)
  shop_uuid: string; // The internal UUID
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
  const signature = createHmac('sha256', WIDGET_SECRET)
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

    // Verify signature
    const { sig, ...data } = payload;
    const payloadStr = JSON.stringify(data);
    const expectedSig = createHmac('sha256', WIDGET_SECRET)
      .update(payloadStr)
      .digest('hex');

    if (sig !== expectedSig) {
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
