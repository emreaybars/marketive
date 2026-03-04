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
 * Generate complete embed code with full HTML structure
 * Original wheel-widget-2.js design preserved
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

  // Full HTML structure with original design
  return `<!-- Çarkıfelek Widget -->
<div id="carkifelek-widget" class="cf-widget"
     data-supabase-url="${supabaseUrl}"
     data-supabase-key="${supabaseAnonKey}"
     data-token="${finalToken}"
     data-shop-id="${shopUuid}">
  <div class="cf-overlay"></div>
  <div class="cf-popup">
    <button class="cf-close" onclick="this.closest('.cf-widget').style.display='none'">×</button>
    <div class="cf-content">
      <img class="cf-logo" alt="" style="display: none;">
      <div class="cf-info">
        <p class="cf-info-title">Çarkı Çevir Hediyeni Kazan!</p>
        <p class="cf-info-desc">Hediyeni almak için çarkı çevir.</p>
      </div>
      <form id="carkifelek-form">
        <input type="text" name="fullName" placeholder="Adınız Soyadınız" required class="cf-input">
        <input type="text" name="contact" placeholder="E-posta adresiniz" required class="cf-input">
        <button type="submit" class="cf-spin-btn">ÇARKI ÇEVİR</button>
      </form>
      <div class="cf-wheel-container">
        <svg id="carkifelek-wheel" viewBox="0 0 100 100" class="cf-wheel">
          <!-- Çark segmentleri dinamik olarak oluşturulur -->
        </svg>
        <div class="cf-wheel-center"></div>
        <div class="cf-wheel-marker"></div>
      </div>
    </div>
  </div>
  <style>
    .cf-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .cf-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998; display: none; }
    .cf-popup { position: relative; background: linear-gradient(135deg, #8B0000 0%, #CC0000 100%); border-radius: 20px; padding: 24px; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; }
    .cf-close { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .cf-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }
    .cf-content { position: relative; }
    .cf-logo { max-height: 50px; max-width: 120px; object-fit: contain; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto; }
    .cf-info-title { color: white; font-size: 22px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .cf-info-desc { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 20px 0; }
    .cf-input { width: 100%; padding: 14px 16px; border: none; border-radius: 12px; margin-bottom: 12px; font-size: 14px; box-sizing: border-box; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
    .cf-spin-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #d10000 0%, #ff3333 100%); color: white; border: none; border-radius: 30px; font-size: 16px; font-weight: bold; cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 6px 0 rgba(0,0,0,0.2); transition: transform 0.1s, box-shadow 0.1s; text-transform: uppercase; letter-spacing: 1px; }
    .cf-spin-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 0 rgba(0,0,0,0.2); }
    .cf-spin-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 4px 0 rgba(0,0,0,0.2); }
    .cf-spin-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .cf-wheel-container { position: relative; width: 240px; height: 240px; margin: 20px auto 0; }
    .cf-wheel { width: 100%; height: 100%; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3)); }
    .cf-wheel-center { position: absolute; top: 50%; left: 50%; width: 40px; height: 40px; background: white; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 20px rgba(0,0,0,0.3); pointer-events: none; }
    .cf-wheel-marker { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 35px solid #FFD700; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); pointer-events: none; }
  </style>
  <script src="${domain}/widget.js" defer></script>
</div>`
}

export function generateWidgetEmbedCodeSync(_shopId: string, shopUuid: string, token: string, domain: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return '<!-- Widget configuration error: Missing Supabase credentials -->'
  }

  // Full HTML structure with original design (sync version)
  return `<!-- Çarkıfelek Widget -->
<div id="carkifelek-widget" class="cf-widget"
     data-supabase-url="${supabaseUrl}"
     data-supabase-key="${supabaseAnonKey}"
     data-token="${token}"
     data-shop-id="${shopUuid}">
  <div class="cf-overlay"></div>
  <div class="cf-popup">
    <button class="cf-close" onclick="this.closest('.cf-widget').style.display='none'">×</button>
    <div class="cf-content">
      <img class="cf-logo" alt="" style="display: none;">
      <div class="cf-info">
        <p class="cf-info-title">Çarkı Çevir Hediyeni Kazan!</p>
        <p class="cf-info-desc">Hediyeni almak için çarkı çevir.</p>
      </div>
      <form id="carkifelek-form">
        <input type="text" name="fullName" placeholder="Adınız Soyadınız" required class="cf-input">
        <input type="text" name="contact" placeholder="E-posta adresiniz" required class="cf-input">
        <button type="submit" class="cf-spin-btn">ÇARKI ÇEVİR</button>
      </form>
      <div class="cf-wheel-container">
        <svg id="carkifelek-wheel" viewBox="0 0 100 100" class="cf-wheel">
          <!-- Çark segmentleri dinamik olarak oluşturulur -->
        </svg>
        <div class="cf-wheel-center"></div>
        <div class="cf-wheel-marker"></div>
      </div>
    </div>
  </div>
  <style>
    .cf-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .cf-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998; display: none; }
    .cf-popup { position: relative; background: linear-gradient(135deg, #8B0000 0%, #CC0000 100%); border-radius: 20px; padding: 24px; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; }
    .cf-close { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .cf-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }
    .cf-content { position: relative; }
    .cf-logo { max-height: 50px; max-width: 120px; object-fit: contain; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto; }
    .cf-info-title { color: white; font-size: 22px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .cf-info-desc { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 20px 0; }
    .cf-input { width: 100%; padding: 14px 16px; border: none; border-radius: 12px; margin-bottom: 12px; font-size: 14px; box-sizing: border-box; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
    .cf-spin-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #d10000 0%, #ff3333 100%); color: white; border: none; border-radius: 30px; font-size: 16px; font-weight: bold; cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 6px 0 rgba(0,0,0,0.2); transition: transform 0.1s, box-shadow 0.1s; text-transform: uppercase; letter-spacing: 1px; }
    .cf-spin-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 0 rgba(0,0,0,0.2); }
    .cf-spin-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 4px 0 rgba(0,0,0,0.2); }
    .cf-spin-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .cf-wheel-container { position: relative; width: 240px; height: 240px; margin: 20px auto 0; }
    .cf-wheel { width: 100%; height: 100%; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3)); }
    .cf-wheel-center { position: absolute; top: 50%; left: 50%; width: 40px; height: 40px; background: white; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 20px rgba(0,0,0,0.3); pointer-events: none; }
    .cf-wheel-marker { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 35px solid #FFD700; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); pointer-events: none; }
  </style>
  <script src="${domain}/widget.js" defer></script>
</div>`
}
