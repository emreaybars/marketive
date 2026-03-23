/**
 * Widget Token Utility
 * API Key Pattern - UUID based, never expires
 */

/**
 * Generate embed code using API Key Pattern
 * 
 * GÜVENLİK: API Key UUID formatında, tahmin edilemez
 * Expire olmaz, domain whitelist ile korunur
 */
export function generateWidgetEmbedCode(
  _shopId: string,
  apiKey: string,
  domain: string,
  widgetPosition: string = 'middle-right'
): string {
  // GÜVENLİK: API URL environment variable'dan alınır
  const apiUrl = import.meta.env.VITE_WIDGET_API_URL || `${domain}/api/widget`

  if (!apiKey) {
    console.error('[Widget] API Key is required')
    return '<!-- Widget configuration error: API Key is required -->'
  }

  // GÜVENLİK: API Key Pattern - Sadece api-key ve api-url
  return `<!-- Çarkıfelek Widget v7.1 - API Key Pattern -->
<div id="carkifelek-widget"
     data-api-key="${apiKey}"
     data-api-url="${apiUrl}"
     data-widget-position="${widgetPosition}">
</div>
<script id="carkifelek-widget-script"
  src="${domain}/widget.js">
</script>`
}

/**
 * @deprecated Token generation no longer needed with API Key Pattern
 * Use generateWidgetEmbedCode with shop.api_key instead
 */
export async function generateWidgetToken(_shopId: string, _shopUuid: string): Promise<string> {
  throw new Error('Token generation deprecated. Use API Key Pattern instead.')
}

/**
 * @deprecated Use generateWidgetEmbedCode instead
 */
export function generateWidgetEmbedCodeSync(
  _shopId: string,
  _shopUuid: string,
  _token: string,
  _domain: string
): string {
  throw new Error('generateWidgetEmbedCodeSync deprecated. Use generateWidgetEmbedCode with apiKey instead.')
}
