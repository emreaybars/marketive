#!/usr/bin/env node
/**
 * Generate test widget token
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const WIDGET_SECRET = process.env.WIDGET_SECRET || 'default-secret-change-me';
const SUPABASE_URL = 'https://qiiygcclanmgzlrcpmle.supabase.co';
const SUPABASE_SERVICE_KEY = 'your-service-role-key-here';

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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
