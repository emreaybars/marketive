// Vercel Edge Function - Widget API
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL || 'https://qiiygcclanmgzlrcpmle.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const widgetSecret = process.env.WIDGET_SECRET || 'default-secret'

// Helper: Verify shop token
async function verifyShopToken(token: string) {
  try {
    // Base64url decode
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='

    const payload = JSON.parse(Buffer.from(base64, 'base64').toString())
    const { sig, ...data } = payload

    // Verify signature
    const crypto = require('crypto')
    const payloadStr = JSON.stringify(data)
    const expectedSig = crypto
      .createHmac('sha256', widgetSecret)
      .update(payloadStr)
      .digest('hex')

    if (sig !== expectedSig) {
      return null
    }

    return { shopId: data.sid, shopUuid: data.uid }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  // CORS headers
  const origin = request.headers.get('origin') || '*'

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse('ok', { headers: corsHeaders })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const shopAuth = await verifyShopToken(token)
    if (!shopAuth) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get shop info
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopAuth.shopUuid)
      .single()

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404, headers: corsHeaders }
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

    // Get prizes
    const { data: prizes } = await supabase
      .from('prizes')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (!prizes || prizes.length === 0) {
      return NextResponse.json(
        { error: 'No prizes found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const formattedPrizes = prizes.map(prize => ({
      id: prize.id,
      name: prize.name,
      description: prize.description,
      coupons: prize.coupon_codes ? prize.coupon_codes.split('\n').filter(c => c.trim()) : [],
      url: prize.redirect_url,
      color: prize.color,
      chance: prize.chance
    }))

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

    return NextResponse.json(response, { headers: corsHeaders })

  } catch (error) {
    console.error('Widget API error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

export const runtime = 'edge'
