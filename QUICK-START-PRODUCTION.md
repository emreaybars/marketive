# 🚀 Production Deployment - Hızlı Başlangıç

## En Kolay Yol: Railway + Vercel

### 1. Hazırlık (5 dakika)

```bash
# 1. Güvenli secret üret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Çıktıyı kopyala (sonra kullanacağız)
```

### 2. Railway - API Server (3 dakika)

```bash
# 1. railway.com adresine git
# 2. "New Project" > "Deploy from GitHub"
# 3. Reposunu seç
# 4. Environment variables ekle:
SUPABASE_URL=https://qiiygcclanmgzlrcpmle.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here...
WIDGET_SECRET=kopyaladığınız_secret_buraya
PORT=3001
NODE_ENV=production

# 5. Root Directory: server
# 6. Start Command: npm run api:prod
# 7. "Deploy" tıkla
```

**API URL örn:** `https://carkifelek-api-production.up.railway.app`

### 3. Vercel - Admin Panel (2 dakika)

```bash
# 1. vercel.com adresine git
# 2. "Add New Project" > Reposunu seç
# 3. Environment variables:
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://qiiygcclanmgzlrcpmle.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
WIDGET_API_URL=https://carkifelek-api-production.up.railway.app

# 4. "Deploy" tıkla
```

### 4. Widget.js'i Yayınla (1 dakika)

Vercel otomatik olarak `public/` klasörünü sunar:

```
https://your-app.vercel.app/widget.js
```

### 5. Test!

```bash
# API test
curl https://your-api.railway.app/api/widget/health

# Widget test
# Admin panelde shop oluştur
# Embed kodunu al ve test et
```

---

## 💰 Maliyet

| Hizmet | Plan | Maliyet |
|--------|------|--------|
| Railway | Hobby | Ücretsiz |
| Vercel | Hobby | Ücretsiz |
| Supabase | Free | Ücretsiz |
| **Toplam** | | **₺0/ay** |

**Pro için:**
- Railway Pro: $20/ay
- Vercel Pro: $20/ay
- Supabase Pro: $25/ay
- **Toplam:** ~$65/ay

---

## ⚡ Deploy Script (Alternatif)

```bash
# Deploy script ile otomatik deployment
./deploy.sh railway    # API server
./deploy.sh vercel     # Admin panel
```

---

## 🔗 Domain Bağlama

### Railway (API)
```
railway domain -ch your-api.yourdomain.com
```

### Vercel (Admin)
```
vercel domains add your-admin.yourdomain.com
```

---

## ✅ Test Checklist

- [ ] `/api/widget/health` çalışıyor
- [ ] `/widget.js` erişilebilir
- [ ] Admin panel açılıyor
- [ ] Shop oluşturulabiliyor
- [ ] Token üretiliyor
- [ ] Widget embed kodu çalışıyor
- [ ] Çark dönebiliyor
- [ ] Email kaydediliyor

---

## 🎯 Sonuç

**Admin Panel:** `https://admin.yourdomain.com`
**API Server:** `https://api.yourdomain.com`
**Widget.js:** `https://cdn.yourdomain.com/widget.js`

**Embed Kodu:**
```html
<script
  data-shop-token="PRODUCED_TOKEN"
  src="https://cdn.yourdomain.com/widget.js">
</script>
```
