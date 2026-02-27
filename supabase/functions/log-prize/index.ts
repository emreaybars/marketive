// Supabase Edge Function: Log Prize
// Replaces: api.php?action=log_prize

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Device detection helper
function detectDevice(userAgent: string) {
  const deviceType = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)
    ? 'Mobile'
    : /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(userAgent)
    ? 'Tablet'
    : 'Desktop'

  let os = 'Unknown'
  if (/windows|win32|win64/i.test(userAgent)) os = 'Windows'
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS'
  else if (/android/i.test(userAgent)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS'
  else if (/linux/i.test(userAgent)) os = 'Linux'

  let browser = 'Unknown'
  if (/MSIE|Trident/i.test(userAgent)) browser = 'Internet Explorer'
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/Chrome/i.test(userAgent)) {
    if (/Edge|Edg/i.test(userAgent)) browser = 'Edge'
    else if (/OPR|Opera/i.test(userAgent)) browser = 'Opera'
    else browser = 'Chrome'
  } else if (/Safari/i.test(userAgent)) browser = 'Safari'

  return { deviceType, os, browser }
}

// Brevo integration
async function subscribeToBrevo(
  email: string,
  attributes: Record<string, any>,
  brevoApiKey: string,
  brevoListId: number
) {
  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [brevoListId],
        updateEnabled: true
      })
    })

    if (response.ok) {
      return { success: true }
    }

    const error = await response.json()
    return { success: false, message: error.message || 'Brevo hatası' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// Klaviyo integration
async function subscribeToKlaviyo(
  email: string,
  attributes: Record<string, any>,
  publicKey: string,
  privateKey: string,
  listId: string
) {
  try {
    // Create/update profile
    const profileResponse = await fetch(`https://a.klaviyo.com/api/profiles/`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Klaviyo-API-Key ${privateKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email,
            properties: attributes
          }
        }
      })
    })

    // Subscribe to list
    if (listId) {
      await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Klaviyo-API-Key ${privateKey}`
        },
        body: JSON.stringify({
          data: [{
            type: 'profile',
            attributes: { email }
          }]
        })
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// Helper to verify API key
function isValidApiKey(req: Request): boolean {
  const apiKey = req.headers.get('apikey')
  const authHeader = req.headers.get('authorization')
  return !!apiKey || !!authHeader
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!isValidApiKey(req)) {
    return new Response(
      JSON.stringify({ error: 'API key required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { shop_id, prize_id, email } = body

    if (!shop_id || !prize_id) {
      return new Response(
        JSON.stringify({ error: 'shop_id ve prize_id gereklidir' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get shop UUID and settings
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_id', shop_id)
      .single()

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: 'Mağaza bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get prize info
    const { data: prize, error: prizeError } = await supabase
      .from('prizes')
      .select('*')
      .eq('id', prize_id)
      .eq('shop_id', shop.id)
      .single()

    if (prizeError || !prize) {
      return new Response(
        JSON.stringify({ error: 'Ödül bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user info
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                   req.headers.get('x-real-ip') ||
                   'Unknown'
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const referrer = req.headers.get('referer') || null
    const deviceInfo = detectDevice(userAgent)

    // Get coupon code if available
    let couponCode = body.coupon_code
    if (!couponCode && prize.coupon_codes) {
      const codes = prize.coupon_codes.split('\n').filter(c => c.trim())
      couponCode = codes.length > 0 ? codes[0] : null
    }

    // Insert won_prizes record
    const { data: wonPrize, error: insertError } = await supabase
      .from('won_prizes')
      .insert({
        shop_id: shop.id,
        prize_id: prize.id,
        email: email?.toLowerCase(),
        coupon_code: couponCode
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Ödül kaydedilemedi' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log wheel_spin
    await supabase
      .from('wheel_spins')
      .insert({
        shop_id: shop.id,
        email: email?.toLowerCase(),
        result: prize.name,
        prize_type: prize.name,
        prize_value: couponCode,
        coupon_code: couponCode,
        ip_address: userIp,
        user_agent: userAgent,
        session_id: body.session_id || null
      })

    // Integrations (if email provided)
    if (email) {
      // Brevo
      if (shop.brevo_api_key && shop.brevo_list_id) {
        const attributes = {
          SHOP_NAME: shop.name || '',
          SHOP_ID: shop_id,
          PRIZE_NAME: prize.name,
          PRIZE_ID: prize_id,
          COUPON_CODE: couponCode || '',
          PRIZE_DESCRIPTION: prize.description,
          DEVICE_TYPE: deviceInfo.deviceType,
          SUBSCRIPTION_SOURCE: 'Çarkıfelek Widget',
          SUBSCRIPTION_DATE: new Date().toISOString().split('T')[0],
          REFERRER_URL: referrer || ''
        }

        await subscribeToBrevo(email, attributes, shop.brevo_api_key, shop.brevo_list_id)
      }

      // Klaviyo
      if (shop.klaviyo_private_key && shop.klaviyo_list_id) {
        const klaviyoAttributes = {
          'Shop Name': shop.name || '',
          'Shop ID': shop_id,
          'Prize Name': prize.name,
          'Prize ID': prize_id,
          'Coupon Code': couponCode || '',
          'Prize Description': prize.description,
          'Device Type': deviceInfo.deviceType,
          'Subscription Source': 'Çarkıfelek Widget',
          'Subscription Date': new Date().toISOString().split('T')[0],
          'Referrer URL': referrer || ''
        }

        await subscribeToKlaviyo(
          email,
          klaviyoAttributes,
          shop.klaviyo_public_key || '',
          shop.klaviyo_private_key,
          shop.klaviyo_list_id
        )
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Ödül başarıyla kaydedildi',
        won_prize_id: wonPrize.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Log prize error:', error)
    return new Response(
      JSON.stringify({ error: 'Sunucu hatası' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
