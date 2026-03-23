# 🏗️ Teknik Dokümantasyon

**Proje:** Çarkıfelek Widget Sistemi  
**Versiyon:** 7.1.0  
**Son Güncelleme:** 2026-03-05

---

## 📋 İçindekiler

1. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Güvenlik Mimarisi](#güvenlik-mimarisi)
4. [API Dokümantasyonu](#api-dokümantasyonu)
5. [Veritabanı Şeması](#veritabanı-şeması)
6. [Deployment](#deployment)

---

## 🛠️ Kullanılan Teknolojiler

### Frontend
| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Tip Güvenliği |
| Vite | 5.x | Build Tool |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | - | UI Bileşenleri |
| TanStack Router | - | Routing |
| TanStack Table | - | Data Grid |
| Clerk | - | Authentication |

### Backend
| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| Supabase | - | Database & Auth |
| PostgreSQL | 15.x | Veritabanı |
| Vercel Serverless | - | API Hosting |
| Node.js | 20.x | Runtime |

### Widget
| Teknoloji | Açıklama |
|-----------|----------|
| Vanilla JS | Browser uyumluluğu için |
| SVG | Çark animasyonları |
| CSS3 | Animasyonlar ve efektler |

### Araçlar
| Teknoloji | Amaç |
|-----------|------|
| Docker | Geliştirme ortamı |
| GitHub Actions | CI/CD |
| ESLint | Kod kalitesi |
| Prettier | Kod formatı |

---

## 🏛️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React App  │  │  Widget.js   │  │   Admin Panel│  │
│  │  (Dashboard) │  │  (Embed)     │  │   (Settings) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼────────────────┼────────────────┼──────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                      API LAYER                           │
│                   (Vercel Serverless)                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /api/widget │  │    CORS      │  │ Rate Limit   │  │
│  │   Handler    │  │   Handler    │  │   Handler    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
└─────────┼──────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                         │
│                      (Supabase)                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    shops     │  │  wheel_spins │  │    prizes    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ wheel_wins   │  │widget_views  │  │widget_settings│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Güvenlik Mimarisi

### 1. Kimlik Doğrulama ve Yetkilendirme

```
┌─────────────────────────────────────────────────────────┐
│                    AUTH FLOW                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Client ──► Clerk Auth ──► JWT Token ──► Supabase Row   │
│  (React)    (Frontend)     (Session)     Level Security │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Widget API Güvenlik Katmanları

| Katman | Mekanizma | Açıklama |
|--------|-----------|----------|
| 1. HTTPS | `x-forwarded-proto` | SSL/TLS zorunlu |
| 2. CORS | Dinamiz Domain | Shop başına izin listesi |
| 3. Rate Limit | In-Memory | IP: 10, API Key: 100 req/min |
| 4. API Key | UUID Format | Cache + validasyon |
| 5. Input Validasyon | Regex | Email, telefon, isim kontrolü |
| 6. RLS | PostgreSQL | Veritabanı seviyesi güvenlik |

### 3. Güvenlik Önlemleri Detayı

#### CORS (Cross-Origin Resource Sharing)
```typescript
// Dinamik CORS - Shop'un allowed_domains'ine göre
function setCorsHeaders(req, res, allowedDomains) {
    const origin = req.headers.origin;
    if (validateDomain(allowedDomains, origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
}
```

#### Rate Limiting
```typescript
// IP bazlı: 10 req/min
// API Key bazlı: 100 req/min
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const RATE_LIMIT_IP_MAX = 10;
const RATE_LIMIT_MAX = 100;
```

#### Input Validasyonu
```typescript
validators = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    phone: (phone) => /^[\+]?[\d\s\-\(\)]{10,20}$/.test(phone),
    fullName: (name) => name.length >= 2 && name.length <= 100,
    apiKey: (key) => /^[a-f0-9\-]{36,}$/i.test(key),
    prizeId: (id) => /^[a-f0-9\-]{36,}$/i.test(id)
}
```

---

## 📡 API Dokümantasyonu

### Widget API

Base URL: `https://api.carkifelek.io/api/widget`

#### 1. Get Widget Data
```http
GET /data?api_key={api_key}
```

**Parametreler:**
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| api_key | string | Evet | Shop API anahtarı |

**Yanıt:**
```json
{
  "shop": {
    "uuid": "...",
    "name": "Mağaza Adı",
    "logo": "...",
    "url": "...",
    "contactInfoType": "email"
  },
  "widget": {
    "title": "...",
    "description": "...",
    "buttonText": "...",
    "showOnLoad": true,
    "popupDelay": 2000
  },
  "prizes": [...]
}
```

#### 2. Check Contact
```http
POST /check-contact
Content-Type: application/json

{
  "api_key": "...",
  "contact": "user@example.com"
}
```

**Yanıt:**
```json
{
  "exists": true
}
```

#### 3. Spin (Çark Çevirme)
```http
POST /spin
Content-Type: application/json

{
  "api_key": "...",
  "prize_id": "...",
  "full_name": "John Doe",
  "contact": "user@example.com",
  "user_agent": "..."
}
```

**Yanıt:**
```json
{
  "status": "success",
  "spin_id": "...",
  "coupon_code": "ABC123"
}
```

#### 4. Track View
```http
POST /view
Content-Type: application/json

{
  "api_key": "...",
  "user_agent": "...",
  "referrer": "..."
}
```

---

## 🗄️ Veritabanı Şeması

### Tablolar

#### shops
```sql
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    brand_name TEXT,
    contact_info_type TEXT DEFAULT 'email',
    allowed_domains TEXT, -- JSON array
    api_key TEXT UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### wheel_spins
```sql
CREATE TABLE wheel_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    result TEXT,
    prize_name TEXT, -- Yeni eklendi
    prize_type TEXT,
    prize_value TEXT,
    coupon_code TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### wheel_wins
```sql
CREATE TABLE wheel_wins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id),
    spin_id UUID REFERENCES wheel_spins(id),
    prize_id UUID REFERENCES prizes(id),
    coupon_code TEXT,
    claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### prizes
```sql
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id),
    name TEXT NOT NULL,
    description TEXT,
    redirect_url TEXT,
    color TEXT,
    chance INTEGER,
    coupon_codes TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true
);
```

---

## 🚀 Deployment

### Ortamlar

| Ortam | URL | Branch |
|-------|-----|--------|
| Production | https://carkifelek.io | main |
| Staging | https://staging.carkifelek.io | develop |

### Çevre Değişkenleri

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# Clerk (Auth)
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Vercel
VERCEL_TOKEN=
```

### Deployment Akışı

```
1. Git Push (main branch)
   │
   ▼
2. GitHub Actions Trigger
   │
   ▼
3. Build & Test
   │
   ▼
4. Vercel Deployment
   │
   ▼
5. Live Production
```

### Docker (Geliştirme)

```bash
# Geliştirme ortamı başlatma
docker-compose up -d

# Migration çalıştırma
supabase db push
```

---

## 📊 Monitoring

### Loglama
- Vercel Function Logs
- Supabase Database Logs
- Console.error (Client-side)

### Metrikler
- API response times
- Error rates
- Spin conversion rates
- Widget view counts

---

## 🔄 Versiyon Geçmişi

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| 7.1.0 | 2026-03-05 | Güvenlik güncellemeleri, prize_name eklendi |
| 7.0.0 | 2026-02-28 | API Key pattern, yeni tasarım |
| 6.0.0 | 2026-02-15 | Token-based auth |

---

## 📞 Destek

**Teknik Destek:** tech@carkifelek.io  
**Güvenlik:** security@carkifelek.io
