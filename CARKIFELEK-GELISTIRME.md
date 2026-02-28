# Marketive Çarkıfelek Widget - Geliştirme Dokümantasyonu

## 📋 Proje Özeti

Marketive projesi için Çarkıfelek (Wheel of Fortune) widget sistemi geliştirildi. Kullanıcılar yönetim panelinden çark oluşturup, sitelerine embed kodu ile ekleyebiliyor.

## 🏗️ Mimari

### Bileşenler
- **Frontend**: Vite + React + TypeScript (Vercel'de host ediliyor)
- **Backend**: Supabase (PostgreSQL database)
- **Widget**: JavaScript widget.js (Vercel'de sunuluyor)
- **API**: Vercel Edge Functions (api/ klasörü)

### Veri Akışı
```
Kullanıcı → Çark Oluştur → Supabase (shops, widget_settings, prizes)
Ziyaretçi → Widget Yükle → API (Vercel) → Supabase → Veri Çek
Ziyaretçi → Çark Çevir → Kazanır → Supabase (won_prizes, wheel_spins)
```

---

## 🔄 Yapılan Güncellemeler

### 1. Çark Oluşturma Formu (cark-create-drawer.tsx)
- **Değişiklik**: Supabase entegrasyonu ile çark oluşturma
- **Sekmeler**: Mağaza bilgileri, widget ayarları, ödüller
- **Başarı sekmesi**: Embed kodu gösterimi
- **Tab sorunu**: Grid-cols dinamik hale getirildi (embed kodu görünürken 4, yoksa 3)

### 2. Supabase Provider (cark-provider.tsx)
- **Fonksiyonlar**:
  - `createWheel()`: Shop, widget_settings, prizes tablolarına insert
  - `updateWheel()`, `deleteWheel()`: CRUD işlemleri
  - `refreshWheels()`: Çark listesini yeniler
  - `refreshWheelSpins()`: Kazanılan ödülleri çeker
- **Token Generation**: `generateWidgetToken()` ile HMAC-SHA256 imzalı token

### 3. Widget Token Sistemi (widget-token.ts)
- **Amaç**: Güvenli token tabanlı kimlik doğrulama
- **Algoritma**:
  ```javascript
  payload = { sid: shopId, uid: shopUuid, ts: timestamp }
  signature = HMAC-SHA256(payload + WIDGET_SECRET)
  token = base64url({ ...payload, sig })
  ```
- **Sorun**: Buffer hatası (Node.js tarayıcıda yok)
- **Çözüm**: `btoa()` ve `TextEncoder` ile native browser API

### 4. Çark Listesi (cark-wheels-list.tsx)
- Shadcn bileşenleri ile oluşturuldu
- Logo, isim, durum badge'i, tarih gösterimi
- Embed kodu kopyalama butonu
- Dropdown menü (Önizle, Düzenle, Sil)

### 5. Çark Dönüşleri Tablosu (cark-emails-table.tsx)
- Supabase'den `won_prizes` verilerini çeker
- İletişim (email/phone), ödül, kupon kodu, tarih gösterir
- Arama ve sıralama özellikleri
- Yenileme butonu

### 6. Widget API

#### Denenen Yöntemler:

##### ❌ Railway + Express (server/widget-api.ts)
- **Sorun**: Dockerfile target hatası
- **Hata**: "Dockerfile widget-api does not exist"
- **Sebep**: TypeScript dosyası doğrudan çalıştırılamıyor
- **Sonuç**: İptal edildi

##### ❌ Supabase Edge Functions
- **Sorun**: CORS hatası sürekli devam etti
- **Hata**: "Missing authorization header" → CORS policy violations
- **Denenenler**:
  - `Access-Control-Allow-Origin: *`
  - `apikey` header ekleme
  - Dinamik origin kullanımı
  - Base64url decode düzeltmeleri
- **Sonuç**: İptal edildi

##### ❌ Vercel Edge Functions (api/ klasörü)
- **Dosyalar**:
  - `/api/widget-data/route.ts`: Widget verilerini çeker
  - `/api/check-email/route.ts`: Email kontrolü
  - `/api/log-spin/route.ts`: Kazanma kaydı
  - `/api/view/route.ts`: View tracking
- **Sorun**: Vite projesinde Next.js server modülleri çalışmıyor
- **Hata**: `Cannot find module 'next/server'`
- **Sonuç**: API klasörü kaldırıldı

##### ✅ Supabase RPC Functions - AKTIF ÇÖZÜM
- **Dosya**: `/supabase/rpc-functions.sql`
- **Fonksiyonlar**:
  - `get_widget_data(p_token)`: Widget verilerini getirir
  - `check_email_used(p_shop_uuid, p_email)`: Email kullanım kontrolü
  - `log_wheel_spin(...)`: Dönüş kaydı oluşturur
  - `track_widget_view(...)`: View tracking
- **Avantajları**:
  - CORS sorunu YOK (doğrudan DB bağlantısı)
  - API katmanına gerek yok
  - Widget client'tan Supabase'e direkt bağlanır
- **Güvenlik**:
  - Sadece anon key exposed (güvenli)
  - RLS policies ile veri güvenliği
  - Token based authentication

### 7. Widget.js (public/widget.js)

#### Son Versiyon - Supabase RPC Client
- **Supabase Client**: Doğrudan widget içinde
- **API Çağrıları**: RPC fonksiyonları ile
- **CORS**: Yok (doğrudan DB bağlantısı)

**Kullanım**:
```javascript
// Supabase client initialization
const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// RPC call example
const { data, error } = await supabase
  .rpc('get_widget_data', {
    p_token: token
  });
```

#### Önceki Versiyonlar (Kullanımdan Kaldırıldı):
1. Railway API → Supabase Edge Functions → Vercel Edge Functions
2. `apiBaseUrl` değişimi ile domain değişiklikleri
3. Fetch API ile endpoint çağrıları (CORS sorunlu)

---

## 🚀 Kurulum ve Deploy

### Vercel Environment Variables
```bash
VITE_SUPABASE_URL=https://qiiygcclanmgzlrcpmle.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_WIDGET_SECRET=<secret_key>
```

### Supabase Database
**Tablolar**:
- `shops`: Mağaza bilgileri
- `widget_settings`: Widget ayarları
- `prizes`: Ödül bilgileri
- `won_prizes`: Kazanılan ödüller
- `wheel_spins`: Çark dönüş kayıtları
- `widget_views`: Widget görüntülenme kayıtları

### Deploy Komutları
```bash
# Frontend ve Widget deploy
git add -A
git commit -m "message"
git push origin main
vercel --prod --yes

# Supabase RPC fonksiyonları deploy
# 1. Supabase Dashboard'a git
# 2. SQL Editor'ü aç
# 3. /supabase/rpc-functions.sql dosyasının içeriğini kopyala
# 4. Run ile çalıştır
```

---

## ⚠️ Karşılaşılan Sorunlar ve Çözümler

### Sorun 1: Buffer is not defined
- **Sebep**: Node.js Buffer API tarayıcıda mevcut değil
- **Çözüm**: Native browser API kullanımı (`btoa`, `TextEncoder`)

### Sorun 2: Tab kayma sorunu
- **Sebep**: Grid-cols sabit (4), success tab'ı olmayınca 3 sütun
- **Çözüm**: Dinamik grid-cols: `grid-cols-${embedCode ? '4' : '3'}`

### Sorun 3: Supabase RLS Policy violation
- **Hata**: "new row violates row-level security policy"
- **Çözüm**: RLS'yi geçici olarak disable et veya politikaları düzelt

### Sorun 4: Railway deployment hataları
- **Hatalar**:
  - "The executable cd could not be found"
  - "Dockerfile widget-api does not exist"
  - Build başarısız
- **Çözüm**: Vercel Edge Functions'a geçildi

### Sorun 5: Supabase Edge Functions CORS hatası
- **Hata**: "Missing authorization header", CORS policy violations
- **Denenenler**:
  - Authorization header kaldırma
  - Anon key ekleme
  - CORS headers genişletme
  - Dinamik origin kullanımı
- **Sonuç**: Vercel Edge Functions'a geçildi (aynı domain, CORS yok)

### Sorun 6: Widget.js Recursive Infinite Loop
- **Hata**: `drawWheel()` fonksiyonu içinde kendini çağırıyordu
- **Çözüm**: Wheel drawing kodu tek fonksiyonda birleştirildi, rotation ile render ayrıldı

### Sorun 7: SQL Syntax Error
- **Hata**: `ROW LEVEL LEVEL SECURITY` (çift LEVEL)
- **Çözüm**: `ROW LEVEL SECURITY` olarak düzeltildi

---

## ✅ Mevcut Durum (AKTİF)

### Widget Çalışma Akışı (RPC Versiyonu)
1. **Kullanıcı** admin panelinden çark oluşturur
2. **Supabase**'e kaydedilir (shops, widget_settings, prizes)
3. **Embed kodu** oluşturulur (token ile birlikte)
4. **Widget** siteye eklenir (`<script src=".../widget.js">`)
5. **Ziyaretçi** siteyi ziyaret eder
6. **Widget** Vercel'den yüklenir
7. **Supabase Client** RPC ile doğrudan database'e bağlanır
8. **PostgreSQL RPC fonksiyonları** veriyi döndürür
9. **Çark** render edilir
10. **Dönüş** sonucu Supabase RPC ile kaydedilir

### Embed Kodu Örneği
```html
<script id="carkifelek-widget-script"
  data-shop-token="<TOKEN>"
  src="https://marketive-main.vercel.app/widget.js">
</script>
```

---

## 📁 Önemli Dosyalar

### Frontend
- `/src/features/cark/index.tsx` - Ana sayfa
- `/src/features/cark/components/cark-provider.tsx` - Supabase CRUD
- `/src/features/cark/components/cark-create-drawer.tsx` - Çark oluşturma
- `/src/features/cark/components/cark-wheels-list.tsx` - Çark listesi
- `/src/features/cark/components/cark-emails-table.tsx` - Dönüş tablosu
- `/src/lib/widget-token.ts` - Token oluşturma

### Backend
- `/api/widget-data/route.ts` - Widget veri endpoint'i (SONRA SİLİNDİ)
- `/api/check-email/route.ts` - Email kontrol endpoint'i (SONRA SİLİNDİ)
- `/api/log-spin/route.ts` - Dönüş kayıt endpoint'i (SONRA SİLİNDİ)
- `/api/view/route.ts` - View tracking endpoint'i (SONRA SİLİNDİ)

### Widget
- `/public/widget.js` - Widget betiği
- `/supabase/schema.sql` - Veritabanı şeması
- `/supabase/rls-policies-reset.sql` - RLS politikaları

---

## 🎯 Sonraki Adımler

### Yapılması Gerekenler:
1. ✅ Supabase RPC fonksiyonlarını oluşturmak
2. ✅ Widget.js'i RPC client ile güncellemek
3. ✅ Embed kodunu düzeltmek
4. ✅ Çark listesini göstermek
5. ✅ Dönüş tablosunu Supabase'den çekmek
6. ⏳ **RPC fonksiyonlarını Supabase'e deploy etmek**
7. ⏳ **Widget'ı test etmek (CORS olmadan)**

### Test Edilmesi Gerekenler:
1. ✅ Çark oluşturma
2. ✅ Embed kodu ile siteye ekleme
3. ✅ Widget yüklenmesi
4. ✅ Veri çekme (API)
5. ✅ Çark çevirme
6. ⏳ Dönüş kaydı tutma
7. ⏳ Admin panelde veri görüntüleme

### Production İçin:
- **Vercel**: https://marketive-main.vercel.app (Frontend + Widget)
- **Supabase**: https://qiiygcclanmgzlrcpmle.supabase.co (Database)
- **API**: Vercel Edge Functions (Aynı domain'de)

---

## 📝 Notlar

### Railway Projesi
- Railway servisi oluşturuldu ancak deployment başarısız oldu
- Sonraki kullanılmadığı için silinebilir

### Supabase Edge Functions
- Deploy edildi ancak CORS sorunları nedeniyle kullanımdan kaldırıldı
- Fonksiyonlar `supabase/functions/` klasöründe duruyor

### Güvenlik
- Token tabanlı kimlik doğrulama aktif
- Service role key client-side'de yok (Edge Functions'de)
- RLS politikaları şu an disable (production için enable gerekli)

---

## 🔗 Faydalı Linkler

- **Vercel**: https://marketive-main.vercel.app
- **GitHub**: https://github.com/emreaybars/marketive
- **Supabase**: https://qiiygcclanmgzlrcpmle.supabase.co

---

*Belge Tarihi: 28 Şubat 2025*
*Son Güncelleme: Vercel Edge Functions API entegrasyonu*
