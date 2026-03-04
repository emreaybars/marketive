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

/**
 * Generate simple embed code (script only)
 */
export async function generateWidgetEmbedCode(
  shopId: string,
  shopUuid: string,
  domain: string,
  token?: string
): Promise<string> {
  const finalToken = token || await generateWidgetToken(shopId, shopUuid)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Widget] Supabase environment variables missing')
    return '<!-- Widget configuration error: Missing Supabase credentials -->'
  }

  // Basit script-only embed kodu
  return `<!-- Çarkıfelek Widget -->
<div id="carkifelek-widget"
     data-supabase-url="${supabaseUrl}"
     data-supabase-key="${supabaseAnonKey}">
</div>
<script id="carkifelek-widget-script"
  data-shop-token="${finalToken}"
  src="${domain}/widget.js">
</script>`
}

export function generateWidgetEmbedCodeSync(_shopId: string, shopUuid: string, token: string, domain: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return '<!-- Widget configuration error: Missing Supabase credentials -->'
  }

  return `<!-- Çarkıfelek Widget -->
<div id="carkifelek-widget"
     data-supabase-url="${supabaseUrl}"
     data-supabase-key="${supabaseAnonKey}">
</div>
<script id="carkifelek-widget-script"
  data-shop-token="${token}"
  src="${domain}/widget.js">
</script>`
}
