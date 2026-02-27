// Supabase Edge Function: Get Widget Data
// Replaces: api.php?action=get_widget_data&shop_id={shopId}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Helper to verify API key
function isValidApiKey(req: Request): boolean {
  const apiKey = req.headers.get('apikey')
  const authHeader = req.headers.get('authorization')

  // Allow requests with valid anon key or service role key
  // For development: also allow empty apikey (you may want to restrict this in production)
  return !!apiKey || !!authHeader
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Check API key (for public widget access)
  if (!isValidApiKey(req)) {
    return new Response(
      JSON.stringify({ error: 'API key required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const url = new URL(req.url)
    const shopId = url.searchParams.get('shop_id')
    const direct = url.searchParams.get('direct')
    const referrer = req.headers.get('referer') || ''

    if (!shopId) {
      return new Response(
        JSON.stringify({ error: 'Mağaza ID parametresi gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get shop info
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_id', shopId)
      .single()

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: 'Mağaza bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Domain validation (skip if direct=1)
    if (direct !== '1' && shop.allowed_domains) {
      const allowedDomains = JSON.parse(shop.allowed_domains || '[]')
      if (allowedDomains.length > 0) {
        let referrerDomain = ''
        try {
          const refUrl = new URL(referrer)
          referrerDomain = refUrl.hostname.toLowerCase()
        } catch {
          // Invalid referrer, continue
        }

        if (referrerDomain && !allowedDomains.includes(referrerDomain)) {
          return new Response(
            JSON.stringify({ error: 'Bu alan adından erişim yetkisi bulunmuyor' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Get widget settings
    const { data: widgetSettings, error: widgetError } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('shop_id', shop.id)
      .single()

    const widget = widgetSettings || {
      title: 'Çarkı Çevir<br>Hediyeni Kazan!',
      description: 'Hediyeni almak için hemen çarkı çevir.',
      button_text: 'ÇARKI ÇEVİR',
      show_on_load: true,
      popup_delay: 2000
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
        brandName: shop.brand_name
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
      JSON.stringify({ error: 'Sunucu hatası' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
