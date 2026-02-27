# Çarkıfelek Widget - Güvenli Mimari

## 🔒 Güvenlik Problemi ve Çözümü

### Sorun
Supabase anon key'in client-side (widget.js) içinde暴露 edilmesi:
- ❌ Herkes anahtarınızı görebilir
- ❌ API kotaları tüketilebilir
- ❌ Kötüye kullanıma açık
- ❌ SaaS ürünü için uygun değil

### Çözüm: Token Tabanlı Güvenlik
- ✅ Supabase anahtarları sunucuda gizli
- ✅ Her shop için benzersiz token
- ✅ HMAC imzası ile doğrulama
- ✅ Kendi API sunucunuz üzerinden erişim
- ✅ İptal edilebilir tokenler

## Mimari

```
┌─────────────────┐
│  Client Website │
│   (widget.js)   │
└────────┬────────┘
         │ Token (data-shop-token)
         ▼
┌─────────────────┐
│  Your API Server│ ◄─── Supabase Service Role Key (Gizli)
│  /api/widget/*  │      (Sadece sunucuda)
└────────┬────────┘
         │ Validated Request
         ▼
┌─────────────────┐
│    Supabase     │
│   PostgreSQL    │
└─────────────────┘
```

## Token Yapısı

```javascript
// Token içeriği (base64url encoded)
{
  "sid": "SHOP001",     // Public shop_id
  "uid": "uuid-here",   // Internal UUID
  "ts": 1234567890,     // Timestamp
  "sig": "abc123..."    // HMAC-SHA256 signature
}

// İmzalama
HMAC-SHA256(payload, WIDGET_SECRET)
```

## Kurulum

### 1. Environment Variables

`.env` dosyasına ekleyin:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Widget API
WIDGET_API_PORT=3001
WIDGET_SECRET=random-secure-string-32-chars-min
```

### 2. Widget API'yi Başlatın

```bash
npm run api
```

API şu endpoint'leri sunar:
- `GET  /api/widget/data?token={token}`
- `POST /api/widget/check-email`
- `POST /api/widget/log-spin`
- `POST /api/widget/view`

### 3. Widget Dosyasını Yayınlayın

`public/widget.js` dosyasını CDN'inize veya sunucunuza yükleyin.

### 4. Admin Panel'de Token Üretin

```typescript
import { generateWidgetEmbedCode } from '@/lib/widget-embed';

const { html, token } = generateWidgetEmbedCode({
  shopId: 'SHOP001',
  shopUuid: 'uuid-here',
  domain: 'https://yourdomain.com'
});

console.log(html);
// <script id="carkifelek-widget-script"
//   data-shop-token="..."
//   src="https://yourdomain.com/widget.js">
// </script>
```

## Embed Kodu

```html
<script id="carkifelek-widget-script"
  data-shop-token="GENERATED_TOKEN_HERE"
  src="https://yourdomain.com/widget.js">
</script>
```

## Güvenlik Notları

### WIDGET_SECRET
- Production'da **kesinlikle** değiştirin
- En az 32 karakter rastgele string
- `.env` dosyasında saklayın, asla commit etmeyin

### Token Validasyonu
- Token her API isteğinde doğrulanır
- İmza uyuşmazlığı = 401 Unauthorized
- Cache ile performans optimize edilir (5 dakika)

### Rate Limiting (Önerilen)
Production'da rate limiting ekleyin:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/widget/', limiter);
```

## Production Deployment

### Option 1: Aynı Sunucu
Vite dev server ve API aynı sunucuda:

```bash
# Terminal 1: Vite
npm run dev

# Terminal 2: API
npm run api
```

### Option 2: Ayrı Sunucular
API'yi ayrı bir sunucuda çalıştırın:

```bash
# Production server
npm run api:prod
```

### Option 3: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000 3001
CMD ["npm", "run", "api:prod"]
```

## Monitoring

API loglarını izleyin:

```bash
# Development
npm run api

# Logs:
# 🚀 Widget API running on port 3001
# GET /api/widget/data - 200 - 15ms
# POST /api/widget/log-spin - 200 - 45ms
```

## Troubleshooting

### 401 Unauthorized
- Token geçersiz veya imza hatası
- WIDGET_SECRET uyumsuzluğu

### 404 Shop Not Found
- Shop bulunamadı
- UUID ile shop_id uyuşmazlığı

### CORS Hatası
- API sunucusu CORS ayarlarını kontrol edin
- Vite proxy config'i inceleyin

## Migration: Eski Sistemden Yeniye

### Eski (Güvensiz):
```html
<script
  data-shop-id="SHOP001"
  data-supabase-url="https://..."
  data-supabase-anon-key="eyJhbGc..."  ❌ EXPOSED!
  src="widget.js">
</script>
```

### Yeni (Güvenli):
```html
<script
  data-shop-token="eyJzaWQiOi..."  ✅ Secure, shop-specific
  src="widget.js">
</script>
```

## Özet

| Özellik | Eski Sistem | Yeni Sistem |
|---------|-------------|-------------|
| Supabase Key | Client'de | Sunucuda ✅ |
| Token | Yok | Shop-specific ✅ |
| Güvenlik | Zayıf | Güçlü ✅ |
| Rate Limiting | Yok | Uygulanabilir ✅ |
| SaaS Ready | Hayır | Evet ✅ |
