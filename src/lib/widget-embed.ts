/**
 * Widget Embed Code Generator
 * Used in admin panel to generate secure embed codes for shops
 */

import crypto from 'crypto';

const WIDGET_SECRET = process.env.WIDGET_SECRET || 'default-secret-change-me';

export interface EmbedCodeOptions {
  shopId: string;      // Public shop_id (VARCHAR)
  shopUuid: string;    // Internal UUID
  domain: string;      // Your domain where widget.js is hosted
}

/**
 * Generate a secure token for widget embed
 */
export function generateWidgetToken(shopId: string, shopUuid: string): string {
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

  const signedPayload = { ...payload, sig: signature };
  return Buffer.from(JSON.stringify(signedPayload)).toString('base64url');
}

/**
 * Generate the HTML embed code for a shop
 */
export function generateWidgetEmbedCode(options: EmbedCodeOptions): {
  html: string;
  token: string;
  previewUrl: string;
} {
  const { shopId, shopUuid, domain } = options;
  const token = generateWidgetToken(shopId, shopUuid);

  const html = `<!-- Çarkıfelek Widget -->
<script id="carkifelek-widget-script"
  data-shop-token="${token}"
  src="${domain}/widget.js">
</script>`;

  const previewUrl = `${domain}/widget-preview?token=${token}`;

  return { html, token, previewUrl };
}

/**
 * Verify a widget token (for internal API use)
 */
export function verifyWidgetToken(token: string): { shopId: string; shopUuid: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());

    const { sig, ...data } = payload;
    const payloadStr = JSON.stringify(data);
    const expectedSig = crypto
      .createHmac('sha256', WIDGET_SECRET)
      .update(payloadStr)
      .digest('hex');

    if (sig !== expectedSig) {
      return null;
    }

    return {
      shopId: data.sid,
      shopUuid: data.uid
    };
  } catch {
    return null;
  }
}

/**
 * Generate a secure random WIDGET_SECRET
 */
export function generateWidgetSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * React component props for embed code display
 */
export interface EmbedCodeDisplayProps {
  shopId: string;
  shopUuid: string;
  domain?: string;
}

/**
 * Example usage in React component:
 *
 * function ShopEmbedCode({ shop }: { shop: Shop }) {
 *   const { embedCode, token } = useWidgetEmbed({
 *     shopId: shop.shop_id,
 *     shopUuid: shop.id,
 *     domain: window.location.origin
 *   });
 *
 *   return (
 *     <div>
 *       <h3>Widget Embed Kodu</h3>
 *       <pre>{embedCode}</pre>
 *       <Button onClick={() => navigator.clipboard.writeText(embedCode)}>
 *         Kopyala
 *       </Button>
 *     </div>
 *   );
 * }
 */
