#!/usr/bin/env node
/**
 * Generate test widget token
 * 
 * GÜVENLİK: Bu script sadece geliştirme ortamında kullanılmalıdır.
 * Tüm credentials environment variables'dan alınır.
 * 
 * Kullanım: WIDGET_SECRET=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node generate-token.mjs SHOP_ID
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// GÜVENLİK: Environment variables zorunlu - hardcoded değerler kaldırıldı
const WIDGET_SECRET = process.env.WIDGET_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GÜVENLİK: Tüm değişkenlerin tanımlı olduğunu kontrol et
if (!WIDGET_SECRET) {
  console.error('❌ HATA: WIDGET_SECRET environment variable gerekli');
  console.error('Örnek: WIDGET_SECRET=your-secret node generate-token.mjs SHOP_ID');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('❌ HATA: SUPABASE_URL environment variable gerekli');
  console.error('Örnek: SUPABASE_URL=https://xxx.supabase.co node generate-token.mjs SHOP_ID');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ HATA: SUPABASE_SERVICE_ROLE_KEY environment variable gerekli');
  console.error('⚠️  UYARI: Service Role Key sadece güvenli ortamlarda kullanılmalıdır!');
  process.exit(1);
}

function generateShopToken(shopId, shopUuid) {
  const payload = {
    sid: shopId,
    uid: shopUuid,
    ts: Date.now(),
  };

  const payloadStr = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', WIDGET_SECRET).update(payloadStr).digest('hex');

  const signedPayload = { ...payload, sig: signature };
  return Buffer.from(JSON.stringify(signedPayload)).toString('base64url');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const shopId = process.argv[2] || 'TEST001';

  const { data: shop } = await supabase
    .from('shops')
    .select('id, shop_id, name')
    .eq('shop_id', shopId)
    .single();

  if (!shop) {
    console.error(`Shop not found: ${shopId}`);
    process.exit(1);
  }

  const token = generateShopToken(shop.shop_id, shop.id);

  console.log('\n========================================');
  console.log('Widget Token Generated');
  console.log('========================================');
  console.log(`Shop ID:    ${shop.shop_id}`);
  console.log(`Shop Name:  ${shop.name}`);
  console.log(`Shop UUID:  ${shop.id}`);
  console.log(`\nToken:`);
  console.log(token);
  console.log('\n========================================');
  console.log('Test Commands:');
  console.log('========================================');
  console.log(`\n# Test widget data endpoint:`);
  console.log(`curl "http://localhost:3001/api/widget/data?token=${token}"`);
  console.log(`\n# Test check-email endpoint:`);
  console.log(`curl -X POST http://localhost:3001/api/widget/check-email \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"token":"${token}","email":"test@example.com"}'`);
  console.log('\n========================================\n');
}

main();
