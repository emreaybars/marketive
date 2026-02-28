// Supabase Edge Function: Get Widget Data
// Token-based authentication for secure widget access

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const widgetSecret = Deno.env.get('WIDGET_SECRET') || 'default-secret'

// Verify shop token (async function)
async function verifyShopToken(token: string): Promise<{ shopId: string; shopUuid: string } | null> {
  try {
    // Base64url to base64 conversion
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='

    const payload = JSON.parse(atob(base64))
    const { sig, ...data } = payload

    // Verify signature - use same method as client
    const payloadStr = JSON.stringify(data)
    const textEncoder = new TextEncoder()
    const key = textEncoder.encode(payloadStr + widgetSecret)
    const keyHash = await crypto.subtle.digest('SHA-256', key)
    const keyArray = Array.from(new Uint8Array(keyHash))
    const expectedSig = keyArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (sig !== expectedSig) {
      console.log('Signature mismatch:', { sig, expectedSig })
      return null
    }

    return { shopId: data.sid, shopUuid: data.uid }
  } catch (error) {
    console.log('Token verification error:', error)
    return null
  }
}

serve(async (req) => {
  // Get origin from request for CORS
  const origin = req.headers.get('origin')

  // CORS headers - allow the requesting origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const shopAuth = await verifyShopToken(token)
    if (!shopAuth) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get shop info by UUID
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopAuth.shopUuid)
      .single()

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: 'Mağaza bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get widget settings
    const { data: widgetSettings } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('shop_id', shop.id)
      .single()

    const widget = widgetSettings || {
      title: 'Çarkı Çevir<br>Hediyeni Kazan!',
      description: 'Hediyeni almak için hemen çarkı çevir.',
      button_text: 'ÇARKI ÇEVİR',
      show_on_load: true,
      popup_delay: 2000,
      title_color: '#ffffff',
      description_color: '#ffffff'
    }

    // Get active prizes
    const { data: prizes, error: prizesError } = await supabase
      .from('prizes')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (prizesError || !prizes || prizes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bu mağaza için tanımlanmış ödül bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format prizes with coupon codes
    const formattedPrizes = prizes.map(prize => {
      const couponCodes = prize.coupon_codes
        ? prize.coupon_codes.split('\n').filter(c => c.trim())
        : []

      return {
        id: prize.id,
        name: prize.name,
        description: prize.description,
        coupons: couponCodes,
        url: prize.redirect_url,
        color: prize.color,
        chance: prize.chance
      }
    })

    const response = {
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
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Widget data error:', error)
    return new Response(
      JSON.stringify({ error: 'Sunucu hatası', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
