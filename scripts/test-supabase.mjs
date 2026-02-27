#!/usr/bin/env node
/**
 * Supabase Integration Test Script
 * Tests database connection, schema, and Edge Functions
 */

import { createClient } from '@supabase/supabase-js';

// Configuration from .env
const SUPABASE_URL = 'https://qiiygcclanmgzlrcpmle.supabase.co';
const SUPABASE_SERVICE_KEY = 'your-service-role-key-here';
const API_BASE = `${SUPABASE_URL}/functions/v1`;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

async function testDatabaseConnection() {
  section('1. Testing Database Connection');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase.from('shops').select('count').limit(1);

    if (error) {
      log('❌ Database connection failed!', 'red');
      log(`Error: ${error.message}`, 'red');
      return false;
    }

    log('✅ Database connection successful!', 'green');
    return true;
  } catch (err) {
    log('❌ Database connection error!', 'red');
    log(`${err.message}`, 'red');
    return false;
  }
}

async function testTablesExist() {
  section('2. Testing Table Schema');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const tables = [
    'users',
    'shops',
    'widget_settings',
    'prizes',
    'wheel_spins',
    'wheel_wins',
    'won_prizes',
    'coupons',
    'analytics_cache',
    'widget_views'
  ];

  let allExist = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        log(`❌ Table '${table}' does not exist`, 'red');
        allExist = false;
      } else if (error) {
        log(`⚠️  Table '${table}' has issues: ${error.message}`, 'yellow');
        allExist = false;
      } else {
        log(`✅ Table '${table}' exists`, 'green');
      }
    } catch (err) {
      log(`❌ Table '${table}' check failed: ${err.message}`, 'red');
      allExist = false;
    }
  }

  return allExist;
}

async function testShopsData() {
  section('3. Testing Shops Data');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from('shops')
    .select('*');

  if (error) {
    log(`❌ Error fetching shops: ${error.message}`, 'red');
    return false;
  }

  log(`✅ Found ${data.length} shop(s)`, 'green');

  if (data.length > 0) {
    log('\nShop details:', 'blue');
    data.forEach(shop => {
      log(`  - ${shop.shop_id}: ${shop.name} (${shop.brand_name || 'No brand'})`, 'blue');
      log(`    Contact Type: ${shop.contact_info_type || 'email'}`, 'blue');
      log(`    Active: ${shop.active ? 'Yes' : 'No'}`, 'blue');
    });
  } else {
    log('\n⚠️  No shops found. You need to add shop data.', 'yellow');
    log('Run: psql < supabase/import-script.sql', 'yellow');
  }

  return data.length > 0;
}

async function testPrizesData() {
  section('4. Testing Prizes Data');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from('prizes')
    .select('*, shops(name)')
    .eq('active', true);

  if (error) {
    log(`❌ Error fetching prizes: ${error.message}`, 'red');
    return false;
  }

  log(`✅ Found ${data.length} active prize(s)`, 'green');

  if (data.length > 0) {
    log('\nPrize details:', 'blue');
    data.forEach(prize => {
      const shopName = prize.shops?.name || 'Unknown';
      log(`  - ${prize.name} (${shopName})`, 'blue');
      log(`    Chance: ${prize.chance}% | Color: ${prize.color}`, 'blue');
    });
  } else {
    log('\n⚠️  No active prizes found. Widget will not work without prizes!', 'yellow');
  }

  return data.length > 0;
}

async function testWidgetSettings() {
  section('5. Testing Widget Settings');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from('widget_settings')
    .select('*, shops(shop_id, name)');

  if (error) {
    log(`❌ Error fetching widget settings: ${error.message}`, 'red');
    return false;
  }

  log(`✅ Found ${data.length} widget setting(s)`, 'green');

  if (data.length > 0) {
    log('\nWidget settings:', 'blue');
    data.forEach(setting => {
      const shopId = setting.shops?.shop_id || 'Unknown';
      log(`  - Shop: ${shopId}`, 'blue');
      log(`    Title: ${setting.title}`, 'blue');
      log(`    Show on Load: ${setting.show_on_load}`, 'blue');
      log(`    Delay: ${setting.popup_delay}ms`, 'blue');
    });
  }

  return data.length > 0;
}

async function testEdgeFunction(functionName, testPayload = null) {
  try {
    const options = {
      method: testPayload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    };

    if (testPayload) {
      options.body = JSON.stringify(testPayload);
    }

    const response = await fetch(`${API_BASE}/${functionName}`, options);
    const data = await response.json();

    return { success: response.ok, status: response.status, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function testEdgeFunctions() {
  section('6. Testing Edge Functions');

  const { data: shops } = await createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    .from('shops')
    .select('shop_id')
    .limit(1);

  const testShopId = shops?.[0]?.shop_id || 'TEST001';

  // Test widget-data function
  log('\nTesting /widget-data endpoint...', 'blue');
  const widgetDataResult = await testEdgeFunction(`widget-data?shop_id=${testShopId}`);

  if (widgetDataResult.success) {
    log('✅ widget-data function is working!', 'green');
    if (widgetDataResult.data.shop) {
      log(`   Shop: ${widgetDataResult.data.shop.name}`, 'green');
    }
  } else if (widgetDataResult.status === 404) {
    log('⚠️  Shop not found (expected if no test data)', 'yellow');
  } else {
    log(`❌ widget-data function error: ${widgetDataResult.status}`, 'red');
  }

  // Test check-email function
  log('\nTesting /check-email endpoint...', 'blue');
  const checkEmailResult = await testEdgeFunction('check-email', {
    email: 'test@example.com',
    shop_id: testShopId
  });

  if (checkEmailResult.success) {
    log('✅ check-email function is working!', 'green');
  } else {
    log(`⚠️  check-email status: ${checkEmailResult.status}`, 'yellow');
  }

  // Test log-prize function
  log('\nTesting /log-prize endpoint...', 'blue');
  const { data: prizes } = await createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    .from('prizes')
    .select('id')
    .limit(1);

  if (prizes && prizes.length > 0) {
    const logPrizeResult = await testEdgeFunction('log-prize', {
      shop_id: testShopId,
      prize_id: prizes[0].id,
      email: 'test@example.com'
    });

    if (logPrizeResult.success) {
      log('✅ log-prize function is working!', 'green');
    } else {
      log(`⚠️  log-prize status: ${logPrizeResult.status}`, 'yellow');
    }
  } else {
    log('⚠️  No prizes to test log-prize function', 'yellow');
  }
}

async function testWidgetEmbed() {
  section('7. Widget Embed Code');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: shops } = await supabase.from('shops').select('shop_id').limit(1);

  if (shops && shops.length > 0) {
    const shopId = shops[0].shop_id;
    log('\n✅ Use this embed code on your website:', 'green');
    log('\n```html', 'blue');
    log(`<script id="carkifelek-widget-script"`, 'blue');
    log(`  data-shop-id="${shopId}"`, 'blue');
    log(`  data-supabase-url="${SUPABASE_URL}"`, 'blue');
    log(`  src="/wheel-widget-supabase.js">`, 'blue');
    log(`</script>`, 'blue');
    log('```\n', 'blue');
  } else {
    log('\n⚠️  No shop found. Add shop data first.', 'yellow');
  }
}

async function runTests() {
  log('\n🚀 Supabase Integration Test', 'cyan');
  log('Project: ' + SUPABASE_URL, 'blue');

  const results = {
    database: await testDatabaseConnection(),
    tables: await testTablesExist(),
    shops: await testShopsData(),
    prizes: await testPrizesData(),
    settings: await testWidgetSettings(),
  };

  // Only test Edge Functions if database is working
  if (results.database && results.tables) {
    await testEdgeFunctions();
  } else {
    log('\n⚠️  Skipping Edge Function tests due to database issues', 'yellow');
  }

  await testWidgetEmbed();

  // Summary
  section('Test Summary');

  const allPassed = Object.values(results).every(v => v);

  if (allPassed) {
    log('✅ All tests passed! Your Supabase integration is ready.', 'green');
    log('\nNext steps:', 'blue');
    log('1. Deploy Edge Functions: supabase functions deploy', 'blue');
    log('2. Add the embed code to your website', 'blue');
    log('3. Test the widget in a browser', 'blue');
  } else {
    log('⚠️  Some tests failed. Please fix the issues above.', 'yellow');
  }

  console.log('\n');
}

runTests().catch(console.error);
