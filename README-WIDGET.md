# Çarkıfelek Widget - Güvenlik Güncellemesi

## ✅ Tamamlandı

### Güvenlik Problemi Çözüldü
- ❌ **Eski:** Supabase anon key client-side'da expose ediliyordu
- ✅ **Yeni:** Token tabanlı güvenlik sistemi ile tamamen güvenli

### Yeni Mimari
```
Website (widget.js)
    ↓ data-shop-token
Your API Server (/api/widget/*)
    ↓ Service Role Key (Gizli)
Supabase Database
```

## Kurulum

### 1. API Sunucusunu Başlatın

```bash
npm run api
```

Çıktı:
```
🚀 Widget API running on port 3001
📡 Endpoints:
   GET  /api/widget/data
   POST /api/widget/check-email
   POST /api/widget/log-spin
   POST /api/widget/view
```

### 2. Widget Dosyasını Yayınlayın

`public/widget.js` dosyasını sunucunuza veya CDN'inize yükleyin.

### 3. Test Edin

```bash
# Token üret
node scripts/generate-token.mjs

# Embed dosyasını tarayıcıda aç
open wheel-widget-embed-secure.html
```

## Admin Panel Entegrasyonu

Çark oluştururken embed kodu göstermek için:

```typescript
import { generateWidgetEmbedCode } from '@/lib/widget-embed';

function CarkCreateDrawer() {
  const handleCreateSuccess = async (shop) => {
    const { html, token, previewUrl } = generateWidgetEmbedCode({
      shopId: shop.shop_id,
      shopUuid: shop.id,
      domain: window.location.origin
    });

    // Show embed code to user
    setEmbedCode(html);
  };

  return (
    <div>
      {/* Shop creation form */}
      <Input name="shop_id" placeholder="SHOP001" />
      <Input name="name" placeholder="Mağaza Adı" />

      {/* Embed code display */}
      {embedCode && (
        <div className="p-4 bg-gray-100 rounded">
          <h3>Widget Embed Kodu</h3>
          <pre className="mt-2">{embedCode}</pre>
          <Button onClick={() => navigator.clipboard.writeText(embedCode)}>
            Kopyala
          </Button>
        </div>
      )}
    </div>
  );
}
```

## Embed Kodu Kullanımı

### Admin Panelde Gösterilen Kod:
```html
<script id="carkifelek-widget-script"
  data-shop-token="GENERATED_TOKEN_HERE"
  src="https://yourdomain.com/widget.js">
</script>
```

### Kullanıcı Bunları Yapar:
1. Admin panelde çark oluşturur
2. Otomatik üretilen embed kodunu kopyalar
3. Kendi websitesine yapıştırır
4. Widget güvenli çalışır ✅

## Test

Tarayıcıda test edin:

```bash
# Development
open wheel-widget-embed-secure.html

# Vite dev server ile widget.js
# http://localhost:3001/widget.js
```

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `server/widget-api.ts` | API sunucusu (Express) |
| `public/widget.js` | Widget JavaScript (client-side) |
| `src/lib/widget-embed.ts` | Token üretme utility |
| `scripts/generate-token.mjs` | Test token üretici |
| `wheel-widget-embed-secure.html` | Test sayfası |

## Güvenlik Notları

### WIDGET_SECRET
`.env` dosyasında **kesinlikle değiştirin**:
```bash
WIDGET_SECRET=<random-32-char-string>
```

Güvenli string üretmek için:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Token Validasyonu
- Her API isteğinde doğrulanır
- HMAC-SHA256 imzası ile korunur
- 5 dakika cache ile performans optimizasyonu

## Production Deployment

### Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
WIDGET_API_PORT=3001
WIDGET_SECRET=your-secret-32-chars-min
```

### Start Komutu
```bash
npm run api:prod
```

### Docker (Opsiyonel)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "run", "api:prod"]
```

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| 401 Unauthorized | Token geçersiz veya WIDGET_SECRET uyumsuz |
| 404 Shop Not Found | Shop bulunamadı |
| CORS Hatası | API CORS ayarlarını kontrol edin |
| Widget görünmüyor | Console'da hata kontrol edin |

## Özet

| Özellik | Durum |
|---------|-------|
| Token Bazlı Güvenlik | ✅ |
| Supabase Keys Gizli | ✅ |
| API Server | ✅ |
| Widget JS | ✅ |
| Test Token Script | ✅ |
| Admin Integration Ready | ✅ |

## Sonraki Adımlar

1. ✅ `.env` dosyasında `WIDGET_SECRET`'i değiştirin
2. ✅ Admin panelde `generateWidgetEmbedCode()` kullanın
3. ✅ Production'da API sunucusunu çalıştırın
4. ✅ `public/widget.js`'yi CDN'e yükleyin

---

**Dokümantasyon:**
- `SECURE-ARCHITECTURE.md` - Detaylı mimari anlatımı
- `DEPLOY-SUPABASE.md` - Supabase kurulumu
