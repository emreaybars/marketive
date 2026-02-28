// Vercel Edge Function - Log Spin
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL || 'https://qiiygcclanmgzlrcpmle.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const widgetSecret = process.env.WIDGET_SECRET || 'default-secret'

async function verifyShopToken(token: string) {
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString())
    const { sig, ...data } = payload
    const crypto = require('crypto')
    const payloadStr = JSON.stringify(data)
    const expectedSig = crypto.createHmac('sha256', widgetSecret).update(payloadStr).digest('hex')
    if (sig !== expectedSig) return null
    return { shopId: data.sid, shopUuid: data.uid }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse('ok', { headers: corsHeaders })
  }

  try {
    const body = await request.json()
    const token = body.token
    const { prize_id, email, session_id, coupon_code } = body

    if (!token || !prize_id) {
      return NextResponse.json({ error: 'Token and prize_id required' }, { status: 400, headers: corsHeaders })
    }

    const shopAuth = await verifyShopToken(token)
    if (!shopAuth) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get prize info
    const { data: prize } = await supabase
      .from('prizes')
      .select('*')
      .eq('id', prize_id)
      .eq('shop_id', shopAuth.shopUuid)
      .single()

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404, headers: corsHeaders })
    }

    // Get coupon code
    let finalCouponCode = coupon_code
    if (!finalCouponCode && prize.coupon_codes) {
      const codes = prize.coupon_codes.split('\n').filter(c => c.trim())
      finalCouponCode = codes[0] || null
    }

    // Insert won_prizes
    const { data: wonPrize, error: insertError } = await supabase
      .from('won_prizes')
      .insert({
        shop_id: shopAuth.shopUuid,
        prize_id: prize.id,
        email: email?.toLowerCase(),
        coupon_code: finalCouponCode
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to log prize' }, { status: 500, headers: corsHeaders })
    }

    // Insert wheel_spins
    await supabase
      .from('wheel_spins')
      .insert({
        shop_id: shopAuth.shopUuid,
        email: email?.toLowerCase(),
        result: prize.name,
        prize_type: prize.name,
        prize_value: finalCouponCode,
        coupon_code: finalCouponCode,
        ip_address: request.headers.get('x-forwarded-for') || request.ip,
        user_agent: request.headers.get('user-agent') || '',
        session_id: session_id || null
      })

    return NextResponse.json({
      status: 'success',
      message: 'Prize logged successfully',
      won_prize_id: wonPrize.id
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Log spin error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: corsHeaders })
  }
}

export const runtime = 'edge'
