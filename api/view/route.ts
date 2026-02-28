// Vercel Edge Function - View Tracking
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

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400, headers: corsHeaders })
    }

    const shopAuth = await verifyShopToken(token)
    if (!shopAuth) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase
      .from('widget_views')
      .insert({
        shop_id: shopAuth.shopUuid,
        session_id: body.session_id || null,
        ip_address: request.headers.get('x-forwarded-for') || request.ip,
        user_agent: request.headers.get('user-agent') || '',
        referrer: request.headers.get('referer') || null
      })

    return NextResponse.json({ status: 'success' }, { headers: corsHeaders })

  } catch (error) {
    return NextResponse.json({ status: 'success' }, { headers: corsHeaders })
  }
}

export const runtime = 'edge'
