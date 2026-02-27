# Supabase Edge Functions Deployment Guide

## Test Results

✅ Database connection: OK
✅ Tables created: OK
✅ Test data added: OK
⚠️ Edge Functions: Need to be deployed

## Current Status

Your Supabase project is ready with:
- **Project URL**: https://qiiygcclanmgzlrcpmle.supabase.co
- **Database schema**: All tables created
- **Test data**: Shop ID `TEST001` with 5 prizes

## Next Steps: Deploy Edge Functions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/qiiygcclanmgzlrcpmle/functions

2. Deploy each function:

   **widget-data function:**
   - Click "New Function"
   - Name: `widget-data`
   - Copy contents from: `supabase/functions/widget-data/index.ts`
   - Click "Deploy"

   **check-email function:**
   - Click "New Function"
   - Name: `check-email`
   - Copy contents from: `supabase/functions/check-email/index.ts`
   - Click "Deploy"

   **log-prize function:**
   - Click "New Function"
   - Name: `log-prize`
   - Copy contents from: `supabase/functions/log-prize/index.ts`
   - Click "Deploy"

3. After deployment, get your anon key:
   - Go to Settings > API
   - Copy "anon public" key

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref qiiygcclanmgzlrcpmle

# Deploy functions
supabase functions deploy widget-data
supabase functions deploy check-email
supabase functions deploy log-prize
```

## After Deployment

### 1. Get Your Anon Key

Go to Supabase Dashboard > Settings > API and copy the `anon` key.

### 2. Test the Functions

```bash
# Test widget-data
curl "https://qiiygcclanmgzlrcpmle.supabase.co/functions/v1/widget-data?shop_id=TEST001" \
  -H "apikey: YOUR_ANON_KEY"

# Test check-email
curl -X POST "https://qiiygcclanmgzlrcpmle.supabase.co/functions/v1/check-email" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","shop_id":"TEST001"}'
```

### 3. Add Widget to Your Website

```html
<script id="carkifelek-widget-script"
  data-shop-id="TEST001"
  data-supabase-url="https://qiiygcclanmgzlrcpmle.supabase.co"
  data-supabase-anon-key="YOUR_ANON_KEY"
  src="/wheel-widget-supabase.js">
</script>
```

## Test Data Summary

Your test shop (`TEST001`) includes:

| Prize | Chance | Color |
|-------|--------|-------|
| %20 İndirim | 30% | #FF6B6B |
| Ücretsiz Kargo | 25% | #4ECDC4 |
| 10 TL İndirim | 20% | #95E1D3 |
| Büyük Ödül | 1% | #F38181 |
| Tekrar Dene | 24% | #AA96DA |

## Environment Variables

Add to your `.env` file:

```
SUPABASE_URL=https://qiiygcclanmgzlrcpmle.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Troubleshooting

### 401 Unauthorized Error
- Make sure you're sending the `apikey` header with your anon key
- Check that the Edge Function is deployed

### 404 Shop Not Found
- Verify the shop_id in your request matches `shops.shop_id`
- Check that the shop exists in the database

### CORS Errors
- The Edge Functions include CORS headers
- If you still get CORS errors, check your browser console for details

## Monitoring

View logs in Supabase Dashboard > Edge Functions > Logs

## Security Notes

- **Never expose** your `service_role_key` in client-side code
- **Only use** the `anon` key in the widget embed code
- Row Level Security (RLS) is enabled on all tables
- Domain validation prevents unauthorized access
