/**
 * Widget Token Utility
 * For generating secure shop tokens for widget embed
 */

// Base64URL encode helper for browser
function base64UrlEncode(data: string): string {
  const bytes = new TextEncoder().encode(data)
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte))
  return btoa(binString.join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function generateWidgetToken(shopId: string, shopUuid: string): Promise<string> {
  const WIDGET_SECRET = import.meta.env.VITE_WIDGET_SECRET || 'change-me-in-production'

  const payload = {
    sid: shopId,
    uid: shopUuid,
    ts: Date.now()
  }

  const payloadStr = JSON.stringify(payload)

  // Browser crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(payloadStr + WIDGET_SECRET)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const signedPayload = { ...payload, sig: hashHex }

  return base64UrlEncode(JSON.stringify(signedPayload))
}

export function generateWidgetEmbedCode(shopId: string, shopUuid: string, domain: string): string {
  const tokenPromise = generateWidgetToken(shopId, shopUuid)

  // For synchronous use, return the code structure (token will be async filled)
  return `<!-- Çarkıfelek Widget -->
<script id="carkifelek-widget-script"
  data-shop-token="${tokenPromise}"
  src="${domain}/widget.js">
</script>`
}
