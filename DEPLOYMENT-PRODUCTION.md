# Production Deployment Guide

## 🚀 Production Deployment

### Ön Hazırlık

```bash
# 1. Güvenli WIDGET_SECRET üretin
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Çıkan output'u kopyalayın, ileride kullanacağız
```

---

## 1. Supabase Production

### 1.1. Schema Deploy

```bash
# Supabase Dashboard > SQL Editor
# supabase/schema.sql içeriğini yapıştırıp çalıştırın
```

### 1.2. Environment Variables

Supabase Dashboard > Settings > API:
- `SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (gizli tutun!)

---

## 2. API Server Deployment

### Option A: Railway (Önerilen - Basit)

```bash
# 1. Railway CLI kur
npm i -g @railway/cli

# 2. Login
railway login

# 3. Proje oluştur
railway init

# 4. Environment variables
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set WIDGET_SECRET=your-secret-here
railway variables set PORT=3001
railway variables set NODE_ENV=production

# 5. package.json'a start script'i ekleyin (zaten var)
# 6. Deploy
railway up

# 7. Domain'i kopyalayın
railway domain
```

### Option B: Render

```bash
# 1. render.com adresine gidin
# 2. "New Web Service" oluşturun
# 3. GitHub reposunuzu bağlayın

Build Settings:
- Build Command: (boş)
- Start Command: npm run api:prod

Environment Variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- WIDGET_SECRET
- PORT=3001
```

### Option C: DigitalOcean App Platform

```bash
# 1. digitalocean.com > Apps > Create App
# 2. GitHub reposu bağlayın

Component 1: API Server
- Run Command: npm run api:prod
- HTTP Port: 3001
- Environment Variables: ekleyin
```

---

## 3. Admin Panel Deployment

### Option A: Vercel (Önerilen)

```bash
# 1. Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Environment variables (Vercel Dashboard > Settings)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 4. Production deploy
vercel --prod
```

### Option B: Netlify

```bash
# 1. Netlify CLI
npm i -g netlify-cli

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist
```

---

## 4. Widget.js Hosting (CDN)

Widget JavaScript dosyasını CDN'e yükleyin:

### Option A: Cloudflare (Ücretsiz)

```bash
# 1. cloudflare.com adresine gidin
# 2. R2 Storage veya Pages kullanın
# 3. public/widget.js dosyasını yükleyin
# 4. URL örn: https://cdn.yourdomain.com/widget.js
```

### Option B: AWS CloudFront

```bash
# S3 bucket'a yükleyin
aws s3 cp public/widget.js s3://your-bucket/widget.js

# CloudFront distribution oluşturun
```

### Option C: Vercel (Basit)

```bash
# public/widget.js'yi projenin root'una koyun
# Vercel otomatik olarak sunar
# URL: https://yourdomain.vercel.app/widget.js
```

---

## 5. DNS Ayarları

```
admin.yourdomain.com    → Admin Panel (Vercel)
api.yourdomain.com      → API Server (Railway)
cdn.yourdomain.com      → Widget.js (CDN)
```

---

## 6. Production Test

### 6.1. API Test

```bash
# API health check
curl https://api.yourdomain.com/api/widget/health

# Widget data test
curl "https://api.yourdomain.com/api/widget/data?token=YOUR_TOKEN"
```

### 6.2. Widget Test

Production'da bir shop oluşturun:

```typescript
// Admin panelde
const { html, token } = generateWidgetEmbedCode({
  shopId: 'PROD001',
  shopUuid: 'uuid-here',
  domain: 'https://cdn.yourdomain.com'
});
```

Embed kodu:
```html
<script
  data-shop-token="PROD_TOKEN"
  src="https://cdn.yourdomain.com/widget.js">
</script>
```

---

## 7. Monitoring

### Loglari İzleme

**Railway:**
- Dashboard > Logs

**Vercel:**
- Dashboard > Logs

**Supabase:**
- Dashboard > Logs

### Rate Limiting (Önerilen)

API server'a ekleyin:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Çok fazla istek, lütfen daha sonra tekrar deneyin.'
});

app.use('/api/widget/', limiter);
```

---

## 8. Güvenlik Kontrol Listesi

- [ ] WIDGET_SECRET değiştirildi (32+ karakter)
- [ ] Supabase service_role_key asla client'a gönderilmiyor
- [ ] CORS ayarları doğru
- [ ] Rate limiting aktif
- [ ] HTTPS zorunlu (SSL sertifikası)
- [ ] Environment variables gizli
- [ ] Database backup aktif
- [ ] Error loglari izleniyor

---

## 9. Domain ve SSL

### SSL Sertifikası (Let's Encrypt - Ücretsiz)

```bash
# Certbot kullanın
sudo certbot certonly --standalone -d api.yourdomain.com

# veya Vercel/Railway otomatik SSL sağlar
```

---

## 10. Backup ve Recovery

### Supabase Backup

Supabase otomatik backup sağlar, ancak manuel export da yapın:

```bash
# Supabase Dashboard > Database > Backups
# "Export" ile tüm veritabanını indirin
```

---

## 11. Son Kontrol

Production'a deploy ettikten sonra:

```bash
# 1. API çalışıyor mu?
curl https://api.yourdomain.com/api/widget/health

# 2. Widget yükleniyor mu?
# Browser console'da hata kontrol edin

# 3. Admin panel erişilebilir mi?
# https://admin.yourdomain.com

# 4. Token üretme çalışıyor mu?
# Admin panelde test shop oluşturun
```

---

## 12. Scale (Ölçeklenme)

Trafik arttığında:

**API Server:**
- Railway: Auto-scale (aynı)
- Render: Deploy hakkında ayarları değiştirin
- Self-hosted: Kubernetes veya Docker Swarm

**Database:**
- Supabase Pro plan'a geçin
- Read replicas ekleyin

---

## Hızlı Summary

| Bileşen | Platform | Domain |
|---------|----------|--------|
| Admin Panel | Vercel | admin.yourdomain.com |
| API Server | Railway | api.yourdomain.com |
| Widget.js | Vercel/CDN | cdn.yourdomain.com |
| Database | Supabase | (managed) |

**Toplam Maliyet (Başlangıç):**
- Railway: ~$5/ay
- Vercel: Ücretsiz tier
- Supabase: Ücretsiz tier
- **Toplam**: ~$5/ay

**Production (Önerilen):**
- Railway Pro: ~$20/ay
- Vercel Pro: ~$20/ay
- Supabase Pro: ~$25/ay
- **Toplam**: ~$65/ay
