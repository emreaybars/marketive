# Marketive Sistem Mimarisi

## Genel Bakis

Marketive, e-ticaret siteleri icin iki ana ozellik sunan bir pazarlama platformudur:

1. **Carkifelek** - Etkilesimli cark widget'i
2. **WhatsApp Marketing** - WhatsApp Business API entegrasyonu

---

## 1. Teknoloji Stack

### Frontend
| Teknoloji | Aciklama |
|-----------|----------|
| React 19 + TypeScript | UI Framework |
| TanStack Router | Routing |
| TanStack Query | Server State |
| Zustand | Client State |
| Radix UI + Tailwind | UI Components |
| Clerk | Authentication |
| Recharts | Grafikler |
| React Hook Form + Zod | Form Yonetimi |

### Backend
| Teknoloji | Aciklama |
|-----------|----------|
| Express.js | API Server |
| Socket.IO | Real-time |
| Helmet | Security |
| Supabase | Database + Auth |

### Database
| Teknoloji | Aciklama |
|-----------|----------|
| PostgreSQL (Supabase) | Relational DB |
| RLS | Row Level Security |
| Storage | File Storage |

---

## 2. Sistem Akis Diyagrami

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Vercel)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  React App                                                          │   │
│  │  ├── Clerk Auth ────────────────────────────┐                      │   │
│  │  ├── TanStack Router ───────────────────────┤                      │   │
│  │  │   ├── /dashboard                        │                      │   │
│  │  │   ├── /cark (Carkifelek)                │                      │   │
│  │  │   ├── /whatsapp                         │                      │   │
│  │  │   ├── /users                            │                      │   │
│  │  │   └── /settings                         │                      │   │
│  │  ├── TanStack Query ────────────────────────┤                      │   │
│  │  └── Zustand Store ─────────────────────────┘                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                      │
│  │  Widget API (3001)   │    │  Main API (3001)     │                      │
│  │  ├── /widget/data    │    │  ├── /whatsapp/*     │                      │
│  │  ├── /widget/spin    │    │  ├── Socket.IO       │                      │
│  │  └── /widget/check   │    │  └── Webhooks        │                      │
│  └──────────────────────┘    └──────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (Supabase)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   shops     │  │   prizes    │  │ wheel_spins │  │ won_prizes  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │wa_contacts  │  │wa_messages  │  │wa_campaigns │  │wa_templates │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DIS SERVISLER                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │   Clerk     │  │Meta WhatsApp│  │   Klaviyo   │                          │
│  │   (Auth)    │  │   (API)     │  │  (Email)    │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Moduller

### 3.1 Carkifelek Modulu

```
src/features/cark/
├── index.tsx                    # Ana sayfa
├── components/
│   ├── cark-chart.tsx          # Istatistik grafikleri
│   ├── cark-stats.tsx          # Istatistik kartlari
│   ├── cark-emails-table.tsx   # Kazananlar tablosu
│   ├── cark-wheels-list.tsx    # Cark listesi
│   ├── cark-create-drawer.tsx  # Yeni cark olusturma
│   ├── cark-edit-drawer.tsx    # Cark duzenleme
│   ├── cark-prize-analytics.tsx# Odul analizi
│   ├── cark-provider.tsx       # State provider
│   └── wheel-preview.tsx       # Onizleme
```

**Ozellikler:**
- Cark olusturma ve yonetme
- Odul ve kupon kodu yapilandirma
- Donus sayisi ve kazanma takibi
- Analitik ve raporlama

### 3.2 WhatsApp Modulu

```
src/features/whatsapp/
├── index.tsx                    # Ana sayfa
├── components/
│   ├── whatsapp-chat.tsx       # Canli mesajlasma
│   ├── whatsapp-chart.tsx      # Analitik grafikleri
│   ├── whatsapp-stats.tsx      # Istatistikler
│   ├── whatsapp-campaigns.tsx  # Toplu mesaj kampanyalari
│   ├── whatsapp-contacts.tsx   # Rehber yonetimi
│   ├── whatsapp-templates.tsx  # Mesaj sablonlari
│   └── whatsapp-provider.tsx   # State provider
```

**Ozellikler:**
- Gercek zamanli mesajlasma
- Toplu mesaj kampanyalari
- Rehber ve etiket yonetimi
- Sablon yonetimi
- Sepet hatirlatma sistemi

### 3.3 Kullanici Yonetimi

```
src/features/users/
├── index.tsx
└── components/
    ├── users-table.tsx
    ├── users-action-dialog.tsx
    └── users-invite-dialog.tsx
```

### 3.4 Ayarlar

```
src/features/settings/
├── profile/                     # Profil ayarlari
├── appearance/                  # Gorum ayarlari
├── notifications/               # Bildirim ayarlari
├── account/                     # Hesap ayarlari
└── display/                     # Gosterim ayarlari
```

---

## 4. Veritabani Semasi

### 4.1 Carkifelek Tablolari

```sql
-- Magazalar
shops
├── id (UUID, PK)
├── customer_id (TEXT) -- Clerk user ID
├── shop_id (VARCHAR) -- Public identifier
├── name (VARCHAR)
├── logo_url (TEXT)
├── website_url (TEXT)
├── allowed_domains (JSONB)
├── brand_name (VARCHAR)
└── contact_info_type (VARCHAR)

-- Oduller
prizes
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── name (VARCHAR)
├── description (TEXT)
├── coupon_codes (TEXT[])
├── redirect_url (TEXT)
├── color (VARCHAR)
├── chance (INTEGER)
└── display_order (INTEGER)

-- Cark Donusleri
wheel_spins
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── email (VARCHAR)
├── result (VARCHAR)
├── prize_type (VARCHAR)
├── prize_value (VARCHAR)
├── coupon_code (VARCHAR)
├── ip_address (INET)
├── user_agent (TEXT)
└── session_id (VARCHAR)

-- Kazanilan Oduller
won_prizes
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── prize_id (UUID, FK -> prizes)
├── email (VARCHAR)
└── coupon_code (VARCHAR)

-- Widget Goruntulenmeleri
widget_views
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── session_id (VARCHAR)
├── ip_address (INET)
├── user_agent (TEXT)
└── referrer (TEXT)

-- Widget Ayarlari
widget_settings
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── title (TEXT)
├── description (TEXT)
├── button_text (VARCHAR)
├── show_on_load (BOOLEAN)
├── popup_delay (INTEGER)
└── color settings...
```

### 4.2 WhatsApp Tablolari

```sql
-- Kisiler
whatsapp_contacts
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── phone_number (VARCHAR)
├── name (VARCHAR)
├── tags (TEXT[])
├── notes (TEXT)
└── is_blocked (BOOLEAN)

-- Mesajlar
whatsapp_messages
├── id (UUID, PK)
├── contact_id (UUID, FK -> contacts)
├── direction (VARCHAR) -- incoming/outgoing
├── type (VARCHAR) -- text/image/video
├── content (TEXT)
├── status (VARCHAR) -- queued/sent/delivered/read
└── timestamp (TIMESTAMP)

-- Kampanyalar
whatsapp_campaigns
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── name (VARCHAR)
├── message (TEXT)
├── target_tags (TEXT[])
├── status (VARCHAR)
├── sent_count (INTEGER)
└── delivered_count (INTEGER)

-- Sablonlar
whatsapp_templates
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── name (VARCHAR)
├── category (VARCHAR)
├── content (TEXT)
└── status (VARCHAR) -- pending/approved/rejected

-- Sepet Hatirlatma
whatsapp_sepet_reminders
├── id (UUID, PK)
├── shop_id (UUID, FK -> shops)
├── phone_number (VARCHAR)
├── reminder_level (INTEGER)
├── cart_value (DECIMAL)
└── is_recovered (BOOLEAN)
```

### 4.3 Iliski Semasi

```
shops
  │
  ├── 1:N ──► prizes
  │              │
  │              └── 1:N ──► won_prizes
  │
  ├── 1:N ──► wheel_spins
  │
  ├── 1:N ──► widget_views
  │
  ├── 1:N ──► widget_settings
  │
  ├── 1:N ──► whatsapp_contacts
  │              │
  │              └── 1:N ──► whatsapp_messages
  │
  ├── 1:N ──► whatsapp_campaigns
  │
  └── 1:N ──► whatsapp_templates
```

---

## 5. Widget Sistemi

### 5.1 Widget Calisma Akisi

```
┌──────────────────────────────────────────────────────────────────┐
│                    MUSTERI WEB SITESI                            │
│                                                                  │
│  <script src="https://domain.com/widget.js"                     │
│          data-shop-token="TOKEN">                                │
│  </script>                                                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    WIDGET YUKLEME                                │
│                                                                  │
│  1. Token'i decode et                                            │
│  2. API'den konfigurasyon cek                                   │
│  3. Domain dogrulama                                             │
│  4. Cark'i render et                                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    KULLANICI ETKILESIMI                          │
│                                                                  │
│  1. Kullanici carki cevirir                                      │
│  2. Sonuc belirlenir (probability)                               │
│  3. Email girisi (opsiyonel)                                     │
│  4. Sonuc gosterilir                                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    VERI KAYDI                                    │
│                                                                  │
│  1. Donus kaydi olusturulur                                      │
│  2. Kazanilan odul kaydedilir                                    │
│  3. Kupon kodu atanir                                            │
│  4. Analytics guncellenir                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Token Sistemi

```typescript
// Token Olusturma
function generateToken(shopId: string, shopUuid: string): string {
  const payload = {
    sid: shopId,        // Public shop ID
    uid: shopUuid,      // Internal UUID
    ts: Date.now()      // Timestamp
  };

  const signature = HMAC_SHA256(payload, WIDGET_SECRET);

  return base64url({ ...payload, sig: signature });
}

// Token Dogrulama
function validateToken(token: string): boolean {
  const decoded = decode(token);

  // 1. Signature dogrula
  // 2. Timestamp kontrolu (5 dk gecerlilik)
  // 3. Shop exists check

  return true;
}
```

### 5.3 Widget API Endpoints

| Endpoint | Method | Aciklama |
|----------|--------|----------|
| `/api/widget/data` | GET | Widget konfigurasyonu |
| `/api/widget/check-email` | POST | Email kontrolu |
| `/api/widget/log-spin` | POST | Donus kaydi |
| `/api/widget/view` | POST | Goruntulenme kaydi |
| `/api/widget/health` | GET | Health check |

---

## 6. Backend API

### 6.1 WhatsApp Endpoints

| Endpoint | Method | Aciklama |
|----------|--------|----------|
| `/api/whatsapp/chats` | GET | Mesaj listesi |
| `/api/whatsapp/send` | POST | Mesaj gonder |
| `/api/whatsapp/contacts` | GET/POST | Rehber |
| `/api/whatsapp/campaigns` | GET/POST | Kampanyalar |
| `/api/whatsapp/templates` | GET/POST | Sablonlar |

### 6.2 Webhooks

```
POST /webhooks/whatsapp
├── Mesaj alindi
├── Mesaj durumu (delivered/read)
└── Hata bildirimleri
```

---

## 7. Guvenlik

### 7.1 Kimlik Dogrulama

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Clerk     │────►│  Frontend   │────►│  Backend    │
│   JWT       │     │  Token      │     │  Validate   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Supabase   │
                                        │  RLS Check  │
                                        └─────────────┘
```

### 7.2 Widget Guvenligi

- HMAC-SHA256 token imzalama
- Domain whitelist kontrolu
- Rate limiting
- CORS policy

### 7.3 Veri Guvenligi

- Row Level Security (RLS)
- Input validation (Zod)
- SQL injection onleme (Supabase)
- XSS onleme (React)

---

## 8. Dosya Yapisi

```
marketive/
├── src/
│   ├── main.tsx                  # Entry point
│   ├── routeTree.gen.ts          # Auto-generated routes
│   ├── routes/
│   │   ├── _authenticated/       # Korumali sayfalar
│   │   │   ├── cark/
│   │   │   ├── whatsapp/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   └── (auth)/               # Auth sayfalari
│   ├── features/                 # Ozellik modulleri
│   │   ├── cark/
│   │   ├── whatsapp/
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── settings/
│   ├── components/               # Paylasilan componentler
│   │   └── ui/                   # UI componentleri
│   ├── context/                  # React context
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utility fonksiyonlar
│   └── assets/                   # Statik dosyalar
│
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── webhooks/             # Webhook handlers
│   │   └── config/               # Konfigurasyon
│   └── package.json
│
├── public/
│   └── widget.js                 # Carkifelek widget
│
├── supabase/
│   └── whatsapp-schema.sql       # DB semasi
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 9. Ortam Degiskenleri

```bash
# Frontend
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CLERK_PUBLISHABLE_KEY=

# Backend
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
WIDGET_SECRET=
FRONTEND_URL=
PORT=

# WhatsApp
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

---

## 10. Komutlar

```bash
# Gelistirme
npm run dev          # Frontend
npm run api          # Widget API

# Backend
cd backend
npm run dev          # Development
npm run start        # Production

# Build
npm run build        # Frontend build

# Lint & Test
npm run lint
npm run typecheck
```

---

## 11. Dis Servis Entegrasyonlari

| Servis | Amac | Dokumantasyon |
|--------|------|---------------|
| Clerk | Kullanici kimlik dogrulama | clerk.com/docs |
| Supabase | Database, Storage, Auth | supabase.com/docs |
| Meta WhatsApp | WhatsApp Business API | developers.facebook.com |
| Klaviyo | Email marketing | klaviyo.com/docs |

---

*Son guncelleme: Mart 2026*
