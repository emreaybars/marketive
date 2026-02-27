// Supabase Edge Function: Check Email
// Replaces: api.php?action=check_email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { email, shop_id } = await req.json()

    if (!email || !shop_id) {
      return new Response(
        JSON.stringify({ error: 'Email ve shop_id parametreleri gereklidir' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get shop UUID from shop_id
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('shop_id', shop_id)
      .single()

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: 'Mağaza bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email exists in won_prizes
    const { data: existingPrize, error: prizeError } = await supabase
      .from('won_prizes')
      .select('id')
      .eq('shop_id', shop.id)
      .eq('email', email.toLowerCase())
      .limit(1)

    const exists = !prizeError && existingPrize && existingPrize.length > 0

    return new Response(
      JSON.stringify({ status: 'success', exists }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Check email error:', error)
    return new Response(
      JSON.stringify({ error: 'Sunucu hatası' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
