# PHP to Supabase Migration Guide

## Overview

This document explains how to migrate from the PHP-based API (`api.php`) to Supabase Edge Functions.

## Architecture Comparison

### PHP Version (Current)
```
┌─────────────────┐
│ wheel-widget.js │
└────────┬────────┘
         │ HTTPS POST/GET
         ▼
    ┌─────────┐
    │ api.php │
    └────┬────┘
         │ PDO
         ▼
    ┌─────────┐
    │  MySQL  │
    └─────────┘
```

### Supabase Version (New)
```
┌──────────────────────────┐
│ wheel-widget-supabase.js │
└────────────┬─────────────┘
             │ HTTPS POST/GET
             ▼
    ┌──────────────────┐
    │ Supabase Edge    │
    │ Functions (Deno) │
    └────────┬─────────┘
             │ PostgreSQL Client
             ▼
    ┌─────────────┐
    │  Supabase   │
    │ PostgreSQL  │
    └─────────────┘
```

## Endpoint Mapping

| PHP Endpoint | Supabase Function | Description |
|-------------|-------------------|-------------|
| `api.php?action=get_widget_data&shop_id={id}` | `/functions/v1/widget-data?shop_id={id}` | Get widget configuration |
| `api.php?action=check_email` | `/functions/v1/check-email` | Check if email already won |
| `api.php?action=log_prize` | `/functions/v1/log-prize` | Log winning spin |

## Key Differences

### 1. Authentication

**PHP Version:**
- Uses database credentials directly in code
- No built-in authentication

**Supabase Version:**
- Uses service role key (server-side)
- RLS policies for row-level security
- Anon key for client access (if needed)

### 2. Database

**PHP Version:**
```sql
CREATE TABLE shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id VARCHAR(50) UNIQUE NOT NULL,
  -- ...
);
```

**Supabase Version:**
```sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id VARCHAR(50) UNIQUE NOT NULL,
  -- ...
);
```

Key changes:
- `INT AUTO_INCREMENT` → `UUID PRIMARY KEY`
- `TIMESTAMP` → `TIMESTAMPTZ`
- Foreign keys use UUIDs
- Added RLS policies

### 3. Response Format

**PHP Version:**
```php
echo json_encode($response);
```

**Supabase Version:**
```typescript
return new Response(
  JSON.stringify(response),
  { headers: { 'Content-Type': 'application/json' } }
)
```

### 4. Error Handling

**PHP Version:**
```php
respondWithError("Error message", $details, 500);
```

**Supabase Version:**
```typescript
return new Response(
  JSON.stringify({ error: 'Error message' }),
  { status: 500, headers: { ...corsHeaders } }
)
```

## Migration Steps

### Step 1: Setup Supabase Project

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Note: Project URL and Service Role Key

### Step 2: Run Database Migration

1. Open SQL Editor in Supabase Dashboard
2. Execute `supabase/schema.sql`
3. Verify tables created

### Step 3: Deploy Edge Functions

**Option A: Using Supabase CLI**
```bash
supabase functions deploy widget-data
supabase functions deploy check-email
supabase functions deploy log-prize
```

**Option B: Using Dashboard**
1. Go to Edge Functions
2. Create function → Paste code → Deploy

### Step 4: Update Widget Embed Code

**Before (PHP):**
```html
<script
  data-shop-id="SHOP001"
  src="https://carkifelek.io/widget.js">
</script>
```

**After (Supabase):**
```html
<script
  data-shop-id="SHOP001"
  data-supabase-url="https://your-project.supabase.co"
  src="https://your-cdn.com/wheel-widget-supabase.js">
</script>
```

### Step 5: Migrate Existing Data

Use `supabase/import-script.sql`:

1. Export data from MySQL
2. Convert to Supabase format
3. Import via SQL Editor or import script

### Step 6: Update Integrations

**Brevo/Klaviyo Keys:**

Before: Stored in environment variables or config file
```php
define('BREVO_API_KEY', 'your-brevo-api-key...');
```

After: Stored in `shops` table per shop
```sql
UPDATE shops
SET brevo_api_key = 'your-brevo-api-key...',
    brevo_list_id = 3
WHERE shop_id = 'SHOP001';
```

### Step 7: Test

1. Update test site embed code
2. Open widget
3. Spin wheel
4. Check database for records
5. Verify email integration

## Rollback Plan

If issues occur:

1. Revert embed code to PHP version
2. Keep PHP server running temporarily
3. Fix Supabase issues
4. Retry migration

## Feature Comparison

| Feature | PHP Version | Supabase Version | Status |
|---------|-------------|------------------|--------|
| Get widget data | ✅ | ✅ | Migrated |
| Check email | ✅ | ✅ | Migrated |
| Log prize | ✅ | ✅ | Migrated |
| Domain validation | ✅ | ✅ | Migrated |
| Brevo integration | ✅ | ✅ | Migrated |
| Klaviyo integration | ✅ | ✅ | Migrated |
| Device detection | ✅ | ✅ | Migrated |
| User authentication | ❌ | ✅ | New |
| RLS security | ❌ | ✅ | New |
| Real-time updates | ❌ | ✅ | Available* |
| Auto-scaling | ❌ | ✅ | New |

*Real-time features available via Supabase Realtime (not implemented in basic migration)

## Performance Benefits

| Metric | PHP Version | Supabase Version |
|--------|-------------|------------------|
| Cold start | ~200-500ms | ~100-300ms |
| Region selection | Single | 11+ regions |
| Auto-scaling | Manual setup | Automatic |
| CDN included | No | Yes |
| DDoS protection | Manual | Built-in |

## Cost Comparison

| Resource | PHP Hosting | Supabase |
|----------|-------------|----------|
| Database | $5-20/mo | Free tier available |
| API Server | $5-20/mo | Included |
| SSL Certificate | $50-100/yr | Free |
| CDN | $5-10/mo | Free |
| **Total** | **~$15-50/mo** | **$0-25/mo** |

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
- PostgreSQL: https://www.postgresql.org/docs/
