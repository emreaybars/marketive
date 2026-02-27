# Carkifelek.io API - Endpoint Listesi

## Base URL
```
Production: https://carkifelek.io/api/v1
Local: http://localhost/api
```

---

## Authentication Endpoint'leri

### 1. Register - Kayıt Ol
```
POST /v1/auth/register
```
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "username": "user@example.com"
    },
    "access_token": "eyJ0eXAiOiJKV1Q...",
    "refresh_token": "eyJ0eXAiOiJKV1Q..."
  }
}
```

---

### 2. Login - Giriş Yap
```
POST /v1/auth/login
```
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com"
    },
    "access_token": "eyJ0eXAiOiJKV1Q...",
    "refresh_token": "eyJ0eXAiOiJKV1Q..."
  }
}
```

---

### 3. Refresh Token - Token Yenile
```
POST /v1/auth/refresh
```
**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1Q..."
}
```
**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1Q...",
    "refresh_token": "eyJ0eXAiOiJKV1Q..."
  }
}
```

---

### 4. Get Current User - Kullanıcı Bilgisi
```
GET /v1/auth/me
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": 1,
      "username": "user@example.com",
      "email": "user@example.com",
      "max_shops": 5,
      "wheels_count": 3,
      "status": "active"
    },
    "auth_type": "jwt"
  }
}
```

---

### 5. Owner Token - Owner Token Al
```
POST /v1/auth/owner-token
```
**Request:**
```json
{
  "email": "owner@example.com"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Owner token retrieved successfully",
  "data": {
    "owner_token": "wk_own_abc123...",
    "max_wheels": 5,
    "is_new": false
  }
}
```

---

## Wheel (Çark) Endpoint'leri

### 6. Create Wheel - Çark Oluştur
```
POST /v1/wheels
Authorization: Bearer {token}
```
**Request:**
```json
{
  "name": "Şanslı Çarkım",
  "website": "https://example.com",
  "brand_name": "Markam",
  "logo_url": "https://example.com/logo.png",
  "allowed_domains": ["example.com", "www.example.com"],
  "primary_color": "#ff5733",
  "title_text": "Çevir ve Kazan!",
  "subtitle_text": "E-posta adresini gir ve şansını dene!",
  "button_text": "Çevir!",
  "email_placeholder": "E-posta adresin",
  "success_message": "Tebrikler!",
  "background_color": "#f0f0f0"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Wheel created successfully",
  "data": {
    "wheel_id": "shop_abc123def456...",
    "name": "Şanslı Çarkım",
    "created_at": "2026-02-25 12:00:00"
  }
}
```

---

### 7. List Wheels - Çark Listesi
```
GET /v1/wheels?page=1&limit=10&status=active
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "wheels": [
      {
        "wheel_id": "shop_abc123...",
        "name": "Şanslı Çarkım",
        "website": "https://example.com",
        "brand_name": "Markam",
        "logo_url": "https://example.com/logo.png",
        "active": true,
        "created_at": "2026-02-25 12:00:00",
        "prizes_count": 5,
        "total_spins": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3
    }
  }
}
```

---

### 8. Get Wheel - Çark Detayı
```
GET /v1/wheels/{wheel_id}
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "wheel": {
      "wheel_id": "shop_abc123...",
      "name": "Şanslı Çarkım",
      "website": "https://example.com",
      "brand_name": "Markam",
      "logo_url": "https://example.com/logo.png",
      "allowed_domains": ["example.com"],
      "primary_color": "#ff5733",
      "title_text": "Çevir ve Kazan!",
      "background_color": "#f0f0f0",
      "active": true,
      "created_at": "2026-02-25 12:00:00",
      "prizes": [
        {
          "id": "1",
          "name": "%10 İndirim",
          "color": "#ff5733",
          "chance": 30
        }
      ]
    }
  }
}
```

---

### 9. Update Wheel - Çark Güncelle
```
PUT /v1/wheels/{wheel_id}
Authorization: Bearer {token}
```
**Request (tüm alanlar opsiyonel):**
```json
{
  "name": "Yeni Çark İsmi",
  "website": "https://yeni-example.com",
  "brand_name": "Yeni Marka",
  "logo_url": "https://yeni-example.com/logo.png",
  "allowed_domains": ["yeni-example.com"],
  "primary_color": "#33ff57",
  "title_text": "Kazanmak İçin Çevir!",
  "subtitle_text": "Şansını Dene!",
  "button_text": "Döndür!",
  "email_placeholder": "Mail adresin",
  "success_message": "Harika!",
  "background_color": "#ffffff",
  "active": true
}
```
**Response:**
```json
{
  "success": true,
  "message": "Wheel updated successfully",
  "data": {
    "wheel": { /* güncellenmiş çark bilgileri */ }
  }
}
```

---

### 10. Delete Wheel - Çark Sil
```
DELETE /v1/wheels/{wheel_id}
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Wheel deleted successfully",
  "data": {
    "wheel_id": "shop_abc123...",
    "deleted": true
  }
}
```

---

## Prize (Ödül) Endpoint'leri

### 11. Create Prize - Ödül Ekle
```
POST /v1/wheels/{wheel_id}/prizes
Authorization: Bearer {token}
```
**Request:**
```json
{
  "name": "%10 İndirim",
  "description": "Siparişinde %10 indirim kazan",
  "color": "#ff5733",
  "chance": 30,
  "redirect_url": "https://example.com/indirim",
  "display_order": 1,
  "active": true,
  "coupons": ["INDIRIM10", "KAZAN10", "PROMO10"]
}
```
**Response:**
```json
{
  "success": true,
  "message": "Prize created successfully",
  "data": {
    "prize_id": "1",
    "name": "%10 İndirim",
    "chance": 30,
    "color": "#ff5733",
    "coupons_added": 3
  }
}
```

---

### 12. List Prizes - Ödül Listesi
```
GET /v1/wheels/{wheel_id}/prizes
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "prizes": [
      {
        "id": "1",
        "name": "%10 İndirim",
        "description": "Siparişinde %10 indirim kazan",
        "color": "#ff5733",
        "chance": 30,
        "redirect_url": "https://example.com/indirim",
        "display_order": 1,
        "active": true
      },
      {
        "id": "2",
        "name": "Ücretsiz Kargo",
        "description": "Siparişine ücretsiz kargo",
        "color": "#33ff57",
        "chance": 25,
        "redirect_url": "",
        "display_order": 2,
        "active": true
      }
    ]
  }
}
```

---

### 13. Update Prize - Ödül Güncelle
```
PUT /v1/wheels/{wheel_id}/prizes/{prize_id}
Authorization: Bearer {token}
```
**Request (tüm alanlar opsiyonel):**
```json
{
  "name": "%20 İndirim",
  "description": "Yeni açıklama",
  "color": "#ff0000",
  "chance": 35,
  "redirect_url": "https://example.com/yeni-indirim",
  "display_order": 2,
  "active": true
}
```
**Response:**
```json
{
  "success": true,
  "message": "Prize updated successfully",
  "data": {
    "prize": { /* güncellenmiş ödül bilgileri */ }
  }
}
```

---

### 14. Delete Prize - Ödül Sil
```
DELETE /v1/wheels/{wheel_id}/prizes/{prize_id}
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Prize deleted successfully",
  "data": {
    "prize_id": "1",
    "deleted": true
  }
}
```

---

## Analytics Endpoint'leri

### 15. Analytics Summary - Özet İstatistik
```
GET /v1/analytics/summary?shop_id={wheel_id}&start_date={date}&end_date={date}
Authorization: Bearer {token}
```
**Query Params:**
- `shop_id` (required) - Çark ID
- `start_date` (optional) - Başlangıç tarihi, varsayılan: 30 gün önce
- `end_date` (optional) - Bitiş tarihi, varsayılan: bugün

**Response:**
```json
{
  "success": true,
  "data": {
    "shop_id": "shop_abc123...",
    "period": {
      "start": "2026-02-01",
      "end": "2026-02-28"
    },
    "metrics": {
      "total_views": 1500,
      "total_spins": 500,
      "total_wins": 500,
      "unique_emails": 350,
      "conversion_rate": 70.0
    },
    "top_prizes": [
      {
        "name": "%10 İndirim",
        "wins": 150,
        "percentage": 30.0
      },
      {
        "name": "Ücretsiz Kargo",
        "wins": 125,
        "percentage": 25.0
      }
    ]
  }
}
```

---

### 16. Analytics Daily - Günlük İstatistik
```
GET /v1/analytics/daily?shop_id={wheel_id}&start_date={date}&end_date={date}
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "daily": [
      {
        "date": "2026-02-01",
        "spins": 45,
        "emails": 32,
        "unique_emails": 28
      },
      {
        "date": "2026-02-02",
        "spins": 52,
        "emails": 38,
        "unique_emails": 33
      }
    ]
  }
}
```

---

### 17. Analytics Devices - Cihaz Dağılımı
```
GET /v1/analytics/devices?shop_id={wheel_id}&start_date={date}&end_date={date}
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "devices": [
      {
        "device_type": "Mobile",
        "count": 300,
        "percentage": 60.0
      },
      {
        "device_type": "Desktop",
        "count": 150,
        "percentage": 30.0
      },
      {
        "device_type": "Tablet",
        "count": 50,
        "percentage": 10.0
      }
    ]
  }
}
```

---

## Widget (Public) Endpoint'leri

### 18. Widget Data - Widget Verisi
```
GET /v1/widget/data?shop_id={wheel_id}
```
**Query Params:**
- `shop_id` (required) - Çark ID
- `direct` (optional, testing) - Domain validation bypass için: 1

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "shop": {
      "shop_id": "shop_abc123...",
      "name": "Şanslı Çarkım",
      "title_text": "Çevir ve Kazan!",
      "subtitle_text": "E-posta adresini gir ve şansını dene!",
      "button_text": "Çevir!",
      "email_placeholder": "E-posta adresin",
      "success_message": "Tebrikler!",
      "primary_color": "#ff5733",
      "background_color": "#f0f0f0"
    },
    "settings": {
      "collect_email": true,
      "require_email": true
    },
    "prizes": [
      {
        "id": "1",
        "name": "%10 İndirim",
        "color": "#ff5733",
        "chance": 30
      },
      {
        "id": "2",
        "name": "Ücretsiz Kargo",
        "color": "#33ff57",
        "chance": 25
      }
    ]
  }
}
```

---

### 19. Widget Spin - Çark Döndür
```
POST /v1/widget/spin
```
**Request:**
```json
{
  "shop_id": "shop_abc123...",
  "email": "oyuncu@example.com"
}
```
**Request (testing için domain bypass):**
```json
{
  "shop_id": "shop_abc123...",
  "email": "oyuncu@example.com",
  "direct": 1
}
```
**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "result": "win",
    "prize": {
      "id": "1",
      "name": "%10 İndirim",
      "description": "Siparişinde %10 indirim kazan",
      "coupon_code": "INDIRIM10",
      "redirect_url": "https://example.com/indirim"
    },
    "spin_id": "spin_abc123..."
  }
}
```

---

### 20. Check Email - E-posta Kontrol
```
POST /v1/widget/check-email
```
**Request:**
```json
{
  "shop_id": "shop_abc123...",
  "email": "oyuncu@example.com"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "has_spun": true,
    "last_spin": "2026-02-25 14:30:00",
    "can_spin_again": false
  }
}
```

---

## System Endpoint

### 21. API Status - API Durumu
```
GET /v1/status
```
**Response:**
```json
{
  "success": true,
  "api": "Carkifelek API v1",
  "status": "online",
  "timestamp": "2026-02-25 18:00:00",
  "database": "connected",
  "stats": {
    "total_shops": 32,
    "total_prizes": 113,
    "total_spins": 25739
  },
  "endpoints": {
    "auth": [
      "POST /v1/auth/register",
      "POST /v1/auth/login",
      "POST /v1/auth/refresh",
      "POST /v1/auth/owner-token",
      "GET /v1/auth/me"
    ],
    "wheels": [
      "GET /v1/wheels",
      "POST /v1/wheels",
      "GET /v1/wheels/{id}",
      "PUT /v1/wheels/{id}",
      "DELETE /v1/wheels/{id}"
    ],
    "prizes": [
      "POST /v1/wheels/{id}/prizes",
      "GET /v1/wheels/{id}/prizes",
      "PUT /v1/wheels/{id}/prizes/{prizeId}",
      "DELETE /v1/wheels/{id}/prizes/{prizeId}"
    ],
    "widget": [
      "GET /v1/widget/data",
      "POST /v1/widget/spin",
      "POST /v1/widget/view",
      "POST /v1/widget/check-email"
    ],
    "analytics": [
      "GET /v1/analytics/summary",
      "GET /v1/analytics/daily",
      "GET /v1/analytics/devices"
    ]
  }
}
```

---

## HTTP Status Code'ları

| Code | Meaning |
|------|---------|
| 200 | OK - Başarılı |
| 201 | Created - Oluşturuldu |
| 400 | Bad Request - Geçersiz istek |
| 401 | Unauthorized - Yetkisiz |
| 403 | Forbidden - Yasak |
| 404 | Not Found - Bulunamadı |
| 429 | Too Many Requests - Çok fazla istek |
| 500 | Internal Server Error - Sunucu hatası |

---

## Error Code'ları

| Error Code | Message |
|------------|---------|
| UNAUTHORIZED | Authentication required |
| FORBIDDEN | Access denied |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Invalid input data |
| RATE_LIMIT_EXCEEDED | Too many requests |
| SERVER_ERROR | Internal server error |
| INVALID_SHOP_ID | Invalid shop ID |
| INVALID_EMAIL | Invalid email address |
| NO_PRIZES | No prizes configured |
| NO_FIELDS | No fields to update |

---

## Request Headers

### Auth Gerektiren Endpoint'ler
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Public Endpoint'ler
```
Content-Type: application/json
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "İşlem mesajı",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Hata mesajı",
  "error_code": "ERROR_CODE"
}
```

---

## Rate Limits

| Endpoint Type | Limit | Per |
|---------------|-------|-----|
| Widget (public) | 100 | hour (IP) |
| Auth | 10 | hour (IP) |
| API (authenticated) | 1000 | hour (user) |
| Analytics | 60 | hour (user) |

---

## cURL Examples

### Register
```bash
curl -X POST https://carkifelek.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","full_name":"Test User"}'
```

### Login
```bash
curl -X POST https://carkifelek.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Create Wheel
```bash
curl -X POST https://carkifelek.io/api/v1/wheels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Test Wheel","website":"https://example.com","allowed_domains":["example.com"]}'
```

### Get Widget Data
```bash
curl "https://carkifelek.io/api/v1/widget/data?shop_id=shop_abc123..."
```

### Spin Wheel
```bash
curl -X POST https://carkifelek.io/api/v1/widget/spin \
  -H "Content-Type: application/json" \
  -d '{"shop_id":"shop_abc123...","email":"player@test.com"}'
```

### Get Analytics
```bash
curl "https://carkifelek.io/api/v1/analytics/summary?shop_id=shop_abc123...&start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
