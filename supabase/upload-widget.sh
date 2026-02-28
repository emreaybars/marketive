#!/bin/bash

# Supabase Storage'a widget.js yükleme script'i

SUPABASE_URL="https://qiiygcclanmgzlrcpmle.supabase.co"
SUPABASE_KEY="YOUR_ANON_KEY_HERE"  # Buraya anon key gelecek
BUCKET_NAME="widget"

# Bucket oluştur
curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "widget",
    "public": true
  }'

# Bucket'ı public yap (CORS için)
curl -X POST "${SUPABASE_URL}/storage/v1/bucket/widget/public" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

# widget.js yükle
curl -X POST "${SUPABASE_URL}/storage/v1/object/widget/widget.js" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/javascript" \
  --data-binary @public/widget.js

# Public URL oluştur
echo "Widget URL: ${SUPABASE_URL}/storage/v1/object/public/widget/widget.js"
