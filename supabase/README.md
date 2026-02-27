# Çarkıfelek Supabase Integration

This directory contains Supabase Edge Functions and configuration for the Çarkıfelek widget system.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon/service role keys from Settings > API

### 2. Run Database Migration

1. Go to SQL Editor in Supabase dashboard
2. Copy and run the contents of `schema.sql`
3. This will create all required tables, indexes, RLS policies, and triggers

### 3. Deploy Edge Functions

Using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy widget-data
supabase functions deploy check-email
supabase functions deploy log-prize
```

Or deploy via Dashboard:

1. Go to Edge Functions in Supabase dashboard
2. Create new function for each:
   - `widget-data` - Copy contents from `functions/widget-data/index.ts`
   - `check-email` - Copy contents from `functions/check-email/index.ts`
   - `log-prize` - Copy contents from `functions/log-prize/index.ts`

### 4. Environment Variables

The Edge Functions use these built-in Supabase secrets (automatically available):
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

### 5. Widget Embed Code

Update your embed code to use Supabase:

```html
<script>
  (function(w,d,s,id){
    // Configuration
    window.CARKIFELEK_CONFIG = {
      shopId: 'YOUR_SHOP_ID',           // From your shops table
      supabaseUrl: 'YOUR_SUPABASE_URL'  // Your Supabase project URL
    };
  })(window,document);
</script>

<script id="carkifelek-widget-script"
  data-shop-id="YOUR_SHOP_ID"
  data-supabase-url="YOUR_SUPABASE_URL"
  src="https://your-cdn.com/wheel-widget-supabase.js">
</script>
```

## API Endpoints

### GET /functions/v1/widget-data?shop_id={shopId}

Returns widget configuration, shop info, and prizes.

**Response:**
```json
{
  "shop": {
    "name": "My Store",
    "logo": "https://...",
    "url": "https://...",
    "brandName": "Brand"
  },
  "widget": {
    "title": "Çarkı Çevir<br>Hediyeni Kazan!",
    "description": "Hediyeni almak için hemen çarkı çevir.",
    "buttonText": "ÇARKI ÇEVİR",
    "showOnLoad": true,
    "popupDelay": 2000,
    "backgroundColor": "#667eea",
    "buttonColor": "#667eea"
  },
  "prizes": [
    {
      "id": "uuid",
      "name": "%10 İndirim",
      "description": "Tüm ürünlerde geçerli",
      "color": "#FF6B6B",
      "chance": 30,
      "coupons": ["CODE123"],
      "url": "https://..."
    }
  ]
}
```

### POST /functions/v1/check-email

Checks if an email has already won a prize.

**Request:**
```json
{
  "email": "user@example.com",
  "shop_id": "SHOP123"
}
```

**Response:**
```json
{
  "status": "success",
  "exists": false
}
```

### POST /functions/v1/log-prize

Logs a prize win and triggers integrations.

**Request:**
```json
{
  "shop_id": "SHOP123",
  "prize_id": "uuid",
  "email": "user@example.com",
  "coupon_code": "CODE123",
  "session_id": "sess_123456"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Ödül başarıyla kaydedildi",
  "won_prize_id": "uuid"
}
```

## Database Schema

Key tables:
- `users` - User accounts
- `shops` - Store/shop configurations
- `widget_settings` - Widget appearance settings
- `prizes` - Wheel prizes with chances
- `wheel_spins` - All spin attempts
- `wheel_wins` - Winning spins
- `won_prizes` - Detailed prize wins
- `coupons` - Coupon codes
- `analytics_cache` - Cached analytics
- `widget_views` - Widget view tracking

## Integration Features

### Brevo (formerly Sendinblue)
- Set `brevo_api_key` and `brevo_list_id` in shops table
- Automatically adds subscribers and tracks events

### Klaviyo
- Set `klaviyo_public_key`, `klaviyo_private_key`, and `klaviyo_list_id` in shops table
- Creates profiles and tracks custom events

### Contact Info Type
- Set `contact_info_type` to 'email' or 'phone' in shops table
- Widget will request the appropriate contact method

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own shop's data
- Domain validation prevents unauthorized widget access
- Service role key required for Edge Functions

## Development

### Local Testing

```bash
# Start local Supabase
supabase start

# Test functions locally
supabase functions serve widget-data --no-verify-jwt
```

### Logs

View function logs in Supabase Dashboard > Edge Functions > Logs
