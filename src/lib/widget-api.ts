/**
 * Shop Token Generator for Widget Embed Security
 * Each shop gets a unique token that is used instead of exposing Supabase keys
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface ShopTokenPayload {
  shop_id: string;  // The public shop_id (VARCHAR)
  shop_uuid: string; // The internal UUID
  iat: number;
}

/**
 * Generate a secure token for a shop
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
    shop_id: shop.shop_id,
    shop_uuid: shop.id,
    iat: Date.now(),
  };

  // Simple base64 encoding (for production, use proper JWT signing)
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return token;
}

/**
 * Verify a shop token and return the shop UUID
 */
export function verifyShopToken(token: string): ShopTokenPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());

    // Validate structure
    if (!payload.shop_id || !payload.shop_uuid) {
      return null;
    }

    return payload;
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
