# Carkifelek.io API - React UI Geliştirme Rehberi

## 📚 İçindekiler

1. [API Temelleri](#api-temelleri)
2. [Authentication](#authentication)
3. [Endpoint'ler](#endpointler)
4. [React İçin API Service](#react-için-api-service)
5. [Custom Hooks](#custom-hooks)
6. [State Management](#state-management)
7. [Widget Embed](#widget-embed)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Tam Örnekler](#tam-örnekler)

---

## API Temelleri

### Base URL
```
Production: https://carkifelek.io/api/v1
Local: http://localhost/api (development)
```

### Request Format
```javascript
// Tüm request'ler JSON formatında
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token  // Auth gerektiren endpoint'ler için
}
```

### Response Format
```javascript
// Başarılı Response
{
  success: true,
  message: "İşlem başarılı",
  data: {
    // Response data burada
  }
}

// Hatalı Response
{
  success: false,
  error: "Hata mesajı",
  error_code: "ERROR_CODE"
}
```

---

## Authentication

### 1. JWT Authentication (Kayıtlı Kullanıcılar)

#### Register (Kayıt)
```javascript
// POST /v1/auth/register
const register = async (email, password, fullName) => {
  const response = await fetch('https://carkifelek.io/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName
    })
  });

  const data = await response.json();

  if (data.success) {
    // Local storage'a kaydet
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  }

  throw new Error(data.error);
};
```

#### Login (Giriş)
```javascript
// POST /v1/auth/login
const login = async (email, password) => {
  const response = await fetch('https://carkifelek.io/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  }

  throw new Error(data.error);
};
```

#### Logout (Çıkış)
```javascript
const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  // Redirect to login page
  window.location.href = '/login';
};
```

#### Token Refresh
```javascript
// POST /v1/auth/refresh
const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token');

  const response = await fetch('https://carkifelek.io/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    return data.data.access_token;
  }

  // Refresh başarısız olursa logout
  logout();
  throw new Error('Oturum süresi doldu');
};
```

#### Auth Context (React)
```javascript
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Local storage'dan kullanıcı bilgilerini yükle
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('access_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('https://carkifelek.io/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      setUser(data.data.user);
      setToken(data.data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      return data.data;
    }

    throw new Error(data.error);
  };

  const register = async (email, password, fullName) => {
    const response = await fetch('https://carkifelek.io/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName
      })
    });

    const data = await response.json();

    if (data.success) {
      setUser(data.data.user);
      setToken(data.data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      return data.data;
    }

    throw new Error(data.error);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. Owner Token (Kayıtsız Kullanıcılar)

```javascript
// POST /v1/auth/owner-token
const getOwnerToken = async (email) => {
  const response = await fetch('https://carkifelek.io/api/v1/auth/owner-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await response.json();

  if (data.success) {
    // Owner token format: wk_own_...
    // JWT ile aynı şekilde kullanılabilir
    localStorage.setItem('owner_token', data.data.owner_token);
    return data.data.owner_token;
  }

  throw new Error(data.error);
};
```

---

## Endpoint'ler

### 1. Çark (Wheel) Endpoint'leri

#### Çark Oluştur
```javascript
// POST /v1/wheels
const createWheel = async (wheelData) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch('https://carkifelek.io/api/v1/wheels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(wheelData)
  });

  const data = await response.json();

  if (data.success) {
    return data.data;
  }

  throw new Error(data.error);
};

// Kullanım
const wheel = await createWheel({
  name: 'Şanslı Çarkım',
  website: 'https://example.com',
  brand_name: 'Markam',
  logo_url: 'https://example.com/logo.png',
  allowed_domains: ['example.com', 'www.example.com'],
  primary_color: '#ff5733',
  title_text: 'Çevir ve Kazan!',
  subtitle_text: 'E-posta adresini gir ve şansını dene!',
  button_text: 'Çevir!',
  email_placeholder: 'E-posta adresin',
  success_message: 'Tebrikler!',
  background_color: '#f0f0f0'
});
```

#### Çark Listesi
```javascript
// GET /v1/wheels?page=1&limit=10&status=active
const getWheels = async (page = 1, limit = 10, status = 'active') => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels?page=${page}&limit=${limit}&status=${status}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data.wheels; // Array of wheels
  }

  throw new Error(data.error);
};
```

#### Çark Detayı
```javascript
// GET /v1/wheels/{wheel_id}
const getWheel = async (wheelId) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels/${wheelId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data;
  }

  throw new Error(data.error);
};
```

#### Çark Güncelle
```javascript
// PUT /v1/wheels/{wheel_id}
const updateWheel = async (wheelId, updates) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels/${wheelId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data;
  }

  throw new Error(data.error);
};

// Kullanım
await updateWheel('shop_abc123...', {
  name: 'Yeni İsim',
  active: true
});
```

#### Çark Sil (Soft Delete)
```javascript
// DELETE /v1/wheels/{wheel_id}
const deleteWheel = async (wheelId) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels/${wheelId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return true;
  }

  throw new Error(data.error);
};
```

### 2. Ödül (Prize) Endpoint'leri

#### Ödül Ekle
```javascript
// POST /v1/wheels/{wheel_id}/prizes
const createPrize = async (wheelId, prizeData) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels/${wheelId}/prizes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(prizeData)
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data;
  }

  throw new Error(data.error);
};

// Kullanım
const prize = await createPrize('shop_abc123...', {
  name: '%10 İndirim',
  description: 'Siparişinde %10 indirim kazan',
  color: '#ff5733',
  chance: 30,              // 0-100 arası
  redirect_url: 'https://example.com/indirim',
  display_order: 1,
  active: true,
  coupons: ['INDIRIM10', 'KAZAN10', 'PROMO10'] // Opsiyonel
});
```

#### Ödül Listesi
```javascript
// GET /v1/wheels/{wheel_id}/prizes
const getPrizes = async (wheelId) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels/${wheelId}/prizes`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data.prizes; // Array of prizes
  }

  throw new Error(data.error);
};
```

#### Ödül Güncelle
```javascript
// PUT /v1/wheels/{wheel_id}/prizes/{prize_id}
const updatePrize = async (wheelId, prizeId, updates) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels/${wheelId}/prizes/${prizeId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data;
  }

  throw new Error(data.error);
};
```

#### Ödül Sil
```javascript
// DELETE /v1/wheels/{wheel_id}/prizes/{prize_id}
const deletePrize = async (wheelId, prizeId) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `https://carkifelek.io/api/v1/wheels/${wheelId}/prizes/${prizeId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return true;
  }

  throw new Error(data.error);
};
```

### 3. Analytics Endpoint'leri

#### Özet İstatistikler
```javascript
// GET /v1/analytics/summary?shop_id={wheel_id}&start_date={date}&end_date={date}
const getAnalyticsSummary = async (wheelId, startDate, endDate) => {
  const token = localStorage.getItem('access_token');

  const params = new URLSearchParams({
    shop_id: wheelId,
    start_date: startDate,
    end_date: endDate
  });

  const response = await fetch(
    `https://carkifelek.io/api/v1/analytics/summary?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return {
      period: data.data.period,
      metrics: data.data.metrics,
      topPrizes: data.data.top_prizes
    };
  }

  throw new Error(data.error);
};

// Response format
{
  period: {
    start: "2026-02-01",
    end: "2026-02-28"
  },
  metrics: {
    total_views: 1500,      // Toplam görüntülenme
    total_spins: 500,       // Toplam döndürme
    total_wins: 500,        // Toplam kazanma
    unique_emails: 350,     // Benzersiz e-posta
    conversion_rate: 70.0   // Dönüşüm oranı (%)
  },
  topPrizes: [
    {
      name: "%10 İndirim",
      wins: 150,
      percentage: 30.0
    }
  ]
}
```

#### Günlük İstatistikler
```javascript
// GET /v1/analytics/daily?shop_id={wheel_id}&start_date={date}&end_date={date}
const getDailyAnalytics = async (wheelId, startDate, endDate) => {
  const token = localStorage.getItem('access_token');

  const params = new URLSearchParams({
    shop_id: wheelId,
    start_date: startDate,
    end_date: endDate
  });

  const response = await fetch(
    `https://carkifelek.io/api/v1/analytics/daily?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data.daily; // Array of daily stats
  }

  throw new Error(data.error);
};
```

#### Cihaz Dağılımı
```javascript
// GET /v1/analytics/devices?shop_id={wheel_id}&start_date={date}&end_date={date}
const getDeviceAnalytics = async (wheelId, startDate, endDate) => {
  const token = localStorage.getItem('access_token');

  const params = new URLSearchParams({
    shop_id: wheelId,
    start_date: startDate,
    end_date: endDate
  });

  const response = await fetch(
    `https://carkifelek.io/api/v1/analytics/devices?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    return data.data.devices;
  }

  throw new Error(data.error);
};
```

### 4. Widget (Public) Endpoint'leri

#### Widget Verisi
```javascript
// GET /v1/widget/data?shop_id={wheel_id}
const getWidgetData = async (wheelId) => {
  const response = await fetch(
    `https://carkifelek.io/api/v1/widget/data?shop_id=${wheelId}`
  );

  const data = await response.json();

  if (data.success) {
    return {
      shop: data.data.shop,
      settings: data.data.settings,
      prizes: data.data.prizes
    };
  }

  throw new Error(data.error);
};
```

#### Çark Döndür (Spin)
```javascript
// POST /v1/widget/spin
const spinWheel = async (wheelId, email) => {
  const response = await fetch('https://carkifelek.io/api/v1/widget/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shop_id: wheelId,
      email: email
    })
  });

  const data = await response.json();

  if (data.success) {
    return {
      result: data.data.result,      // 'win'
      prize: data.data.prize,        // Kazanılan ödül
      spinId: data.data.spin_id
    };
  }

  throw new Error(data.error);
};
```

#### E-posta Kontrolü
```javascript
// POST /v1/widget/check-email
const checkEmail = async (wheelId, email) => {
  const response = await fetch('https://carkifelek.io/api/v1/widget/check-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shop_id: wheelId,
      email: email
    })
  });

  const data = await response.json();

  if (data.success) {
    return {
      hasSpun: data.data.has_spun,
      lastSpin: data.data.last_spin,
      canSpinAgain: data.data.can_spin_again
    };
  }

  throw new Error(data.error);
};
```

---

## React İçin API Service

### api.js (Axios ile)
```javascript
// src/services/api.js
import axios from 'axios';

// Axios instance oluştur
const api = axios.create({
  baseURL: 'https://carkifelek.io/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // 401 hatası ve token refresh henüz yapılmadıysa
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('https://carkifelek.io/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token: newRefreshToken } = response.data.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        // Original request'i yeni token ile tekrar dene
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh başarısız olursa logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/v1/auth/register', data),
  login: (data) => api.post('/v1/auth/login', data),
  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  },
  refreshToken: (refresh_token) => api.post('/v1/auth/refresh', { refresh_token }),
  getMe: () => api.get('/v1/auth/me'),
  getOwnerToken: (email) => api.post('/v1/auth/owner-token', { email })
};

// Wheels API
export const wheelsAPI = {
  list: (params) => api.get('/v1/wheels', { params }),
  get: (id) => api.get(`/v1/wheels/${id}`),
  create: (data) => api.post('/v1/wheels', data),
  update: (id, data) => api.put(`/v1/wheels/${id}`, data),
  delete: (id) => api.delete(`/v1/wheels/${id}`)
};

// Prizes API
export const prizesAPI = {
  list: (wheelId) => api.get(`/v1/wheels/${wheelId}/prizes`),
  get: (wheelId, prizeId) => api.get(`/v1/wheels/${wheelId}/prizes/${prizeId}`),
  create: (wheelId, data) => api.post(`/v1/wheels/${wheelId}/prizes`, data),
  update: (wheelId, prizeId, data) =>
    api.put(`/v1/wheels/${wheelId}/prizes/${prizeId}`, data),
  delete: (wheelId, prizeId) =>
    api.delete(`/v1/wheels/${wheelId}/prizes/${prizeId}`)
};

// Analytics API
export const analyticsAPI = {
  summary: (params) => api.get('/v1/analytics/summary', { params }),
  daily: (params) => api.get('/v1/analytics/daily', { params }),
  devices: (params) => api.get('/v1/analytics/devices', { params })
};

// Widget API (Public)
export const widgetAPI = {
  getData: (shopId) =>
    axios.get(`https://carkifelek.io/api/v1/widget/data?shop_id=${shopId}`),
  spin: (data) =>
    axios.post('https://carkifelek.io/api/v1/widget/spin', data),
  checkEmail: (data) =>
    axios.post('https://carkifelek.io/api/v1/widget/check-email', data)
};

export default api;
```

---

## Custom Hooks

### useWheels Hook
```javascript
// src/hooks/useWheels.js
import { useState, useEffect } from 'react';
import { wheelsAPI } from '../services/api';

export const useWheels = (filters = {}) => {
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWheels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wheelsAPI.list(filters);
      setWheels(response.data.wheels);
    } catch (err) {
      setError(err.response?.data?.error || 'Çarklar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWheels();
  }, [JSON.stringify(filters)]);

  const createWheel = async (wheelData) => {
    try {
      const response = await wheelsAPI.create(wheelData);
      setWheels([...wheels, response.data]);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Çark oluşturulamadı');
    }
  };

  const updateWheel = async (wheelId, updates) => {
    try {
      const response = await wheelsAPI.update(wheelId, updates);
      setWheels(wheels.map(w =>
        w.wheel_id === wheelId ? response.data : w
      ));
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Çark güncellenemedi');
    }
  };

  const deleteWheel = async (wheelId) => {
    try {
      await wheelsAPI.delete(wheelId);
      setWheels(wheels.filter(w => w.wheel_id !== wheelId));
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Çark silinemedi');
    }
  };

  return {
    wheels,
    loading,
    error,
    refetch: fetchWheels,
    createWheel,
    updateWheel,
    deleteWheel
  };
};
```

### usePrizes Hook
```javascript
// src/hooks/usePrizes.js
import { useState, useEffect } from 'react';
import { prizesAPI } from '../services/api';

export const usePrizes = (wheelId) => {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrizes = async () => {
    if (!wheelId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await prizesAPI.list(wheelId);
      setPrizes(response.data.prizes);
    } catch (err) {
      setError(err.response?.data?.error || 'Ödüller yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, [wheelId]);

  const addPrize = async (prizeData) => {
    try {
      const response = await prizesAPI.create(wheelId, prizeData);
      setPrizes([...prizes, response.data]);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ödül eklenemedi');
    }
  };

  const updatePrize = async (prizeId, updates) => {
    try {
      const response = await prizesAPI.update(wheelId, prizeId, updates);
      setPrizes(prizes.map(p =>
        p.id === prizeId ? response.data.prize : p
      ));
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ödül güncellenemedi');
    }
  };

  const deletePrize = async (prizeId) => {
    try {
      await prizesAPI.delete(wheelId, prizeId);
      setPrizes(prizes.filter(p => p.id !== prizeId));
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ödül silinemedi');
    }
  };

  return {
    prizes,
    loading,
    error,
    refetch: fetchPrizes,
    addPrize,
    updatePrize,
    deletePrize
  };
};
```

### useAnalytics Hook
```javascript
// src/hooks/useAnalytics.js
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

export const useAnalytics = (wheelId, dateRange) => {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    if (!wheelId || !dateRange.start || !dateRange.end) return;

    try {
      setLoading(true);
      setError(null);

      const [summaryRes, dailyRes, devicesRes] = await Promise.all([
        analyticsAPI.summary({
          shop_id: wheelId,
          start_date: dateRange.start,
          end_date: dateRange.end
        }),
        analyticsAPI.daily({
          shop_id: wheelId,
          start_date: dateRange.start,
          end_date: dateRange.end
        }),
        analyticsAPI.devices({
          shop_id: wheelId,
          start_date: dateRange.start,
          end_date: dateRange.end
        })
      ]);

      setSummary(summaryRes.data);
      setDaily(dailyRes.data.daily || []);
      setDevices(devicesRes.data.devices || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Analitik veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [wheelId, JSON.stringify(dateRange)]);

  return {
    summary,
    daily,
    devices,
    loading,
    error,
    refetch: fetchAnalytics
  };
};
```

### useWidget Hook (Widget için)
```javascript
// src/hooks/useWidget.js
import { useState, useEffect } from 'react';
import { widgetAPI } from '../services/api';

export const useWidget = (wheelId) => {
  const [widgetData, setWidgetData] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWidget = async () => {
      try {
        const response = await widgetAPI.getData(wheelId);
        setWidgetData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Widget yüklenirken hata oluştu');
      }
    };

    if (wheelId) {
      loadWidget();
    }
  }, [wheelId]);

  const spin = async (email) => {
    setSpinning(true);
    setError(null);

    try {
      const response = await widgetAPI.spin({
        shop_id: wheelId,
        email: email
      });
      setResult(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Çark döndürülürken hata oluştu');
      throw err;
    } finally {
      setSpinning(false);
    }
  };

  const checkEmail = async (email) => {
    try {
      const response = await widgetAPI.checkEmail({
        shop_id: wheelId,
        email: email
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'E-posta kontrol edilirken hata oluştu');
    }
  };

  return {
    widgetData,
    spinning,
    result,
    error,
    spin,
    checkEmail
  };
};
```

---

## State Management

### React Context ile Global State
```javascript
// src/context/AppContext.jsx
import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  wheels: [],
  currentWheel: null,
  prizes: [],
  analytics: null,
  loading: false,
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_WHEELS':
      return { ...state, wheels: action.payload };
    case 'ADD_WHEEL':
      return { ...state, wheels: [...state.wheels, action.payload] };
    case 'UPDATE_WHEEL':
      return {
        ...state,
        wheels: state.wheels.map(w =>
          w.wheel_id === action.payload.wheel_id ? action.payload : w
        ),
        currentWheel: state.currentWheel?.wheel_id === action.payload.wheel_id
          ? action.payload
          : state.currentWheel
      };
    case 'DELETE_WHEEL':
      return {
        ...state,
        wheels: state.wheels.filter(w => w.wheel_id !== action.payload),
        currentWheel: state.currentWheel?.wheel_id === action.payload
          ? null
          : state.currentWheel
      };
    case 'SET_CURRENT_WHEEL':
      return { ...state, currentWheel: action.payload };
    case 'SET_PRIZES':
      return { ...state, prizes: action.payload };
    case 'ADD_PRIZE':
      return { ...state, prizes: [...state.prizes, action.payload] };
    case 'UPDATE_PRIZE':
      return {
        ...state,
        prizes: state.prizes.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'DELETE_PRIZE':
      return {
        ...state,
        prizes: state.prizes.filter(p => p.id !== action.payload)
      };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

---

## Widget Embed

### React Component olarak Widget
```javascript
// src/components/CarkifelekWidget.jsx
import { useEffect, useState } from 'react';
import { useWidget } from '../hooks/useWidget';

const CarkifelekWidget = ({ wheelId, onSpinComplete }) => {
  const { widgetData, spinning, result, error, spin } = useWidget(wheelId);
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (!widgetData && !error) {
    return <div className="widget-loading">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="widget-error">{error}</div>;
  }

  const handleSpin = async (e) => {
    e.preventDefault();

    try {
      const spinResult = await spin(email);
      if (onSpinComplete) {
        onSpinComplete(spinResult);
      }
    } catch (err) {
      console.error('Spin error:', err);
    }
  };

  const { shop, settings, prizes } = widgetData;

  return (
    <div
      className="carkifelek-widget"
      style={{
        backgroundColor: shop.background_color || '#f0f0f0',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Header */}
      <div className="widget-header">
        <h2 style={{ color: shop.primary_color }}>
          {shop.title_text || 'Çarkı Çevir!'}
        </h2>
        <p>{shop.subtitle_text || 'E-posta adresini gir ve şansını dene!'}</p>
      </div>

      {/* Wheel */}
      <div className="wheel-container">
        <svg
          className="wheel"
          viewBox="0 0 400 400"
          width="300"
          height="300"
        >
          {/* Prizes segments */}
          {prizes.map((prize, index) => {
            const angle = (360 / prizes.length) * index;
            const path = describeWheelSegment(200, 200, 180, angle, angle + 360 / prizes.length);

            return (
              <g key={prize.id} transform={`rotate(${angle} 200 200)`}>
                <path
                  d={path}
                  fill={prize.color}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x="200"
                  y="200"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="14"
                  transform={`rotate(${360 / prizes.length / 2} 200 200) translate(0, -80)`}
                >
                  {prize.name}
                </text>
              </g>
            );
          })}

          {/* Center circle */}
          <circle cx="200" cy="200" r="30" fill="#fff" />
        </svg>

        {/* Pointer */}
        <div className="wheel-pointer">▼</div>
      </div>

      {/* Email Form */}
      {!result ? (
        <form onSubmit={handleSpin} className="widget-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={shop.email_placeholder || 'E-posta adresin'}
            required
            disabled={spinning}
          />
          <button
            type="submit"
            disabled={spinning}
            style={{
              backgroundColor: shop.primary_color,
              color: '#fff'
            }}
          >
            {spinning ? 'Dönüyor...' : shop.button_text || 'Çevir!'}
          </button>
        </form>
      ) : (
        <div className="widget-result">
          <h3>Tebrikler!</h3>
          <p>{result.prize.name}</p>
          {result.prize.coupon_code && (
            <p className="coupon-code">Kupon: {result.prize.coupon_code}</p>
          )}
          {result.prize.redirect_url && (
            <a
              href={result.prize.redirect_url}
              className="result-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ödüle Git
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function for wheel segments
function describeWheelSegment(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z'
  ].join(' ');
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

export default CarkifelekWidget;
```

### Widget Kullanımı
```javascript
// src/App.jsx
import CarkifelekWidget from './components/CarkifelekWidget';

function App() {
  return (
    <div>
      <h1>Sitem</h1>

      {/* Widget'ı embed et */}
      <CarkifelekWidget
        wheelId="shop_abc123..." // Çark ID
        onSpinComplete={(result) => {
          console.log('Kazanılan:', result.prize);
        }}
      />
    </div>
  );
}
```

---

## Error Handling

### Error Boundary
```javascript
// src/components/ErrorBoundary.jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Bir hata oluştu</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### API Error Handler
```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server response aldı
    const { status, data } = error.response;

    switch (status) {
      case 401:
        return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
      case 403:
        return 'Bu işlem için yetkiniz yok.';
      case 404:
        return data.error || 'İstenen kaynak bulunamadı.';
      case 429:
        return 'Çok fazla istek. Lütfen bekleyin.';
      case 500:
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      default:
        return data.error || 'Bir hata oluştu.';
    }
  } else if (error.request) {
    // Request yapıldı ama response alınamadı
    return 'İnternet bağlantınızı kontrol edin.';
  } else {
    // Request yapılırken hata oluştu
    return error.message || 'Bir hata oluştu.';
  }
};

// Toast notification için
export const showError = (error) => {
  const message = handleApiError(error);
  // Toast library kullanın
  // toast.error(message);
  console.error(message);
};
```

---

## Best Practices

### 1. Token Yönetimi
```javascript
// Token süresi kontrolü
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Otomatik token yenileme
useEffect(() => {
  const checkToken = () => {
    const token = localStorage.getItem('access_token');
    if (isTokenExpired(token)) {
      refreshToken();
    }
  };

  const interval = setInterval(checkToken, 60000); // Her dakika
  return () => clearInterval(interval);
}, []);
```

### 2. Request Debouncing
```javascript
import { useMemo } from 'react';
import { debounce } from 'lodash';

export const useDebounceSearch = (callback, delay = 500) => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  return debouncedCallback;
};
```

### 3. Pagination
```javascript
const usePagination = (fetchFunction) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchFunction(page + 1);
      setData([...data, ...response.data]);
      setHasMore(response.data.length > 0);
      setPage(page + 1);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, hasMore, loadMore };
};
```

### 4. Form Validation
```javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const wheelSchema = yup.object().shape({
  name: yup.string().required('İsim gereklidir').min(3, 'En az 3 karakter'),
  website: yup.string().url('Geçerli bir URL girin'),
  allowed_domains: yup.array().min(1, 'En az bir domain girin')
});

export const useWheelForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(wheelSchema)
  });

  return { register, handleSubmit, errors, reset };
};
```

### 5. Optimistic Updates
```javascript
const updateWheelOptimistically = async (wheelId, updates) => {
  // Önce UI'ı güncelle
  const previousWheels = [...wheels];
  setWheels(wheels.map(w =>
    w.wheel_id === wheelId ? { ...w, ...updates } : w
  ));

  try {
    // API çağrısı yap
    const response = await wheelsAPI.update(wheelId, updates);
    return response.data;
  } catch (error) {
    // Hata olursa geri al
    setWheels(previousWheels);
    throw error;
  }
};
```

---

## Tam Örnekler

### 1. Dashboard Page
```javascript
// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWheels } from '../hooks/useWheels';
import { useAnalytics } from '../hooks/useAnalytics';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { wheels, loading, error } = useWheels({ status: 'active' });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={logout}>Çıkış</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Toplam Çark</h3>
            <p className="stat-value">{wheels.length}</p>
          </div>
          <div className="stat-card">
            <h3>Toplam Döndürme</h3>
            <p className="stat-value">
              {wheels.reduce((sum, w) => sum + (w.total_spins || 0), 0)}
            </p>
          </div>
          <div className="stat-card">
            <h3>Aktif Çark</h3>
            <p className="stat-value">
              {wheels.filter(w => w.active).length}
            </p>
          </div>
        </div>

        <div className="wheels-section">
          <div className="section-header">
            <h2>Çarklarım</h2>
            <Link to="/wheels/new" className="btn-primary">
              + Yeni Çark
            </Link>
          </div>

          {loading ? (
            <div>Yükleniyor...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : wheels.length === 0 ? (
            <div className="empty-state">
              <p>Henüz çarkınız yok. İlk çarkınızı oluşturun!</p>
              <Link to="/wheels/new" className="btn-primary">
                Çark Oluştur
              </Link>
            </div>
          ) : (
            <div className="wheels-grid">
              {wheels.map(wheel => (
                <div key={wheel.wheel_id} className="wheel-card">
                  <h3>{wheel.name}</h3>
                  <p>{wheel.website}</p>
                  <div className="wheel-stats">
                    <span>{wheel.total_spins || 0} döndürme</span>
                    <span>{wheel.prizes_count || 0} ödül</span>
                  </div>
                  <div className="wheel-actions">
                    <Link to={`/wheels/${wheel.wheel_id}`}>Detay</Link>
                    <Link to={`/wheels/${wheel.wheel_id}/edit`}>Düzenle</Link>
                    <Link to={`/wheels/${wheel.wheel_id}/analytics`}>Analitik</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
```

### 2. Create Wheel Page
```javascript
// src/pages/CreateWheel.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWheels } from '../hooks/useWheels';
import { useForm } from 'react-hook-form';

const CreateWheel = () => {
  const navigate = useNavigate();
  const { createWheel } = useWheels();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      // allowed_domains string'i array'e çevir
      const domains = data.allowed_domains
        .split(',')
        .map(d => d.trim())
        .filter(d => d);

      const wheelData = {
        ...data,
        allowed_domains: domains
      };

      const result = await createWheel(wheelData);
      navigate(`/wheels/${result.wheel_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-wheel-page">
      <h1>Yeni Çark Oluştur</h1>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="wheel-form">
        <div className="form-group">
          <label>Çark İsmi *</label>
          <input
            {...register('name', { required: 'Bu alan gereklidir' })}
            placeholder="Örn: Şanslı Çarkım"
          />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label>Web Sitesi *</label>
          <input
            {...register('website', { required: 'Bu alan gereklidir' })}
            placeholder="https://example.com"
          />
          {errors.website && <span className="error">{errors.website.message}</span>}
        </div>

        <div className="form-group">
          <label>Marka Adı</label>
          <input
            {...register('brand_name')}
            placeholder="Markanız"
          />
        </div>

        <div className="form-group">
          <label>Logo URL</label>
          <input
            {...register('logo_url')}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="form-group">
          <label>İzin Verilen Domain'ler (virgülle ayırın)</label>
          <input
            {...register('allowed_domains')}
            placeholder="example.com, www.example.com"
          />
          <small>Widget'ın görüntüleneceği domain'ler</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ana Renk</label>
            <input
              type="color"
              {...register('primary_color')}
              defaultValue="#ff5733"
            />
          </div>

          <div className="form-group">
            <label>Arkaplan Rengi</label>
            <input
              type="color"
              {...register('background_color')}
              defaultValue="#f0f0f0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Başlık Metni</label>
          <input
            {...register('title_text')}
            placeholder="Çevir ve Kazan!"
          />
        </div>

        <div className="form-group">
          <label>Alt Başlık</label>
          <input
            {...register('subtitle_text')}
            placeholder="E-posta adresini gir ve şansını dene!"
          />
        </div>

        <div className="form-group">
          <label>Buton Metni</label>
          <input
            {...register('button_text')}
            placeholder="Çevir!"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Oluşturuluyor...' : 'Çark Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWheel;
```

### 3. Analytics Page
```javascript
// src/pages/Analytics.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#ff5733', '#33ff57', '#3357ff', '#f3ff33', '#ff33f3'];

const Analytics = () => {
  const { wheelId } = useParams();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { summary, daily, devices, loading, error } = useAnalytics(wheelId, dateRange);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analitik</h1>
        <div className="date-range-selector">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <span>-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Toplam Görüntülenme</h3>
          <p className="stat-value">{summary?.metrics?.total_views || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Toplam Döndürme</h3>
          <p className="stat-value">{summary?.metrics?.total_spins || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Benzersiz E-posta</h3>
          <p className="stat-value">{summary?.metrics?.unique_emails || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Dönüşüm Oranı</h3>
          <p className="stat-value">{summary?.metrics?.conversion_rate || 0}%</p>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="chart-container">
        <h2>Günlük İstatistikler</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={daily}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spins" fill="#ff5733" name="Döndürme" />
            <Bar dataKey="emails" fill="#3357ff" name="E-posta" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Device Distribution */}
      <div className="chart-container">
        <h2>Cihaz Dağılımı</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={devices}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: %${percentage}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {devices?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Prizes */}
      <div className="top-prizes">
        <h2>En Çok Kazanılan Ödüller</h2>
        <table>
          <thead>
            <tr>
              <th>Ödül</th>
              <th>Kazanma Sayısı</th>
              <th>Yüzde</th>
            </tr>
          </thead>
          <tbody>
            {summary?.top_prizes?.map((prize, index) => (
              <tr key={index}>
                <td>{prize.name}</td>
                <td>{prize.wins}</td>
                <td>%{prize.percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
```

### 4. Prizes Management Page
```javascript
// src/pages/Prizes.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrizes } from '../hooks/usePrizes';

const Prizes = () => {
  const { wheelId } = useParams();
  const navigate = useNavigate();
  const { prizes, loading, error, addPrize, updatePrize, deletePrize } = usePrizes(wheelId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);

  const handleAdd = async (formData) => {
    try {
      await addPrize(formData);
      setShowAddForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (prizeId, formData) => {
    try {
      await updatePrize(prizeId, formData);
      setEditingPrize(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (prizeId) => {
    if (!confirm('Bu ödülü silmek istediğinizden emin misiniz?')) return;

    try {
      await deletePrize(prizeId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="prizes-page">
      <div className="page-header">
        <h1>Ödüller</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          + Ödül Ekle
        </button>
        <button
          onClick={() => navigate(`/wheels/${wheelId}`)}
          className="btn-secondary"
        >
          Çarka Dön
        </button>
      </div>

      {loading ? (
        <div>Yükleniyor...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : prizes.length === 0 ? (
        <div className="empty-state">
          <p>Henüz ödül yok. İlk ödülü ekleyin!</p>
        </div>
      ) : (
        <div className="prizes-list">
          {prizes.map(prize => (
            <div key={prize.id} className="prize-card">
              <div
                className="prize-color"
                style={{ backgroundColor: prize.color }}
              />
              <div className="prize-info">
                <h3>{prize.name}</h3>
                <p>{prize.description}</p>
                <div className="prize-stats">
                  <span>Şans: %{prize.chance}</span>
                  <span>Durum: {prize.active ? 'Aktif' : 'Pasif'}</span>
                </div>
              </div>
              <div className="prize-actions">
                <button onClick={() => setEditingPrize(prize)}>Düzenle</button>
                <button onClick={() => handleDelete(prize.id)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingPrize) && (
        <PrizeFormModal
          prize={editingPrize}
          onSave={editingPrize
            ? (data) => handleUpdate(editingPrize.id, data)
            : handleAdd
          }
          onCancel={() => {
            setShowAddForm(false);
            setEditingPrize(null);
          }}
        />
      )}
    </div>
  );
};

// Prize Form Component
const PrizeFormModal = ({ prize, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    prize || {
      name: '',
      description: '',
      color: '#ff5733',
      chance: 10,
      redirect_url: '',
      active: true,
      coupons: []
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{prize ? 'Ödül Düzenle' : 'Yeni Ödül'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ödül Adı *</label>
            <input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Açıklama</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Renk</label>
              <input
                type="color"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Şans (%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.chance}
                onChange={e => setFormData({ ...formData, chance: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Yönlendirme URL</label>
            <input
              type="url"
              value={formData.redirect_url}
              onChange={e => setFormData({ ...formData, redirect_url: e.target.value })}
              placeholder="https://example.com/prize"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
              />
              Aktif
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              İptal
            </button>
            <button type="submit" className="btn-primary">
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Prizes;
```

---

## Hızlı Referans

### API Endpoint'leri Özeti

| Endpoint | Method | Auth | Açıklama |
|----------|--------|------|----------|
| `/v1/auth/register` | POST | ❌ | Kayıt ol |
| `/v1/auth/login` | POST | ❌ | Giriş yap |
| `/v1/auth/me` | GET | ✅ | Kullanıcı bilgisi |
| `/v1/auth/owner-token` | POST | ❌ | Owner token al |
| `/v1/wheels` | GET | ✅ | Çark listesi |
| `/v1/wheels` | POST | ✅ | Çark oluştur |
| `/v1/wheels/{id}` | GET | ✅ | Çark detayı |
| `/v1/wheels/{id}` | PUT | ✅ | Çark güncelle |
| `/v1/wheels/{id}` | DELETE | ✅ | Çark sil |
| `/v1/wheels/{id}/prizes` | GET | ✅ | Ödül listesi |
| `/v1/wheels/{id}/prizes` | POST | ✅ | Ödül ekle |
| `/v1/wheels/{id}/prizes/{pid}` | PUT | ✅ | Ödül güncelle |
| `/v1/wheels/{id}/prizes/{pid}` | DELETE | ✅ | Ödül sil |
| `/v1/analytics/summary` | GET | ✅ | Özet istatistik |
| `/v1/analytics/daily` | GET | ✅ | Günlük istatistik |
| `/v1/analytics/devices` | GET | ✅ | Cihaz dağılımı |
| `/v1/widget/data` | GET | ❌ | Widget verisi |
| `/v1/widget/spin` | POST | ❌ | Çark döndür |
| `/v1/widget/check-email` | POST | ❌ | E-posta kontrol |

### Response Code'lar

| Code | Anlamı |
|------|--------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Yetkisiz |
| 403 | Yasak |
| 404 | Bulunamadı |
| 429 | Çok fazla istek |
| 500 | Sunucu hatası |

### Error Code'lar

| Code | Açıklama |
|------|----------|
| UNAUTHORIZED | Oturum gereklidir |
| FORBIDDEN | Erişim reddedildi |
| NOT_FOUND | Kaynak bulunamadı |
| VALIDATION_ERROR | Geçersiz veri |
| RATE_LIMIT_EXCEEDED | İstek limiti aşıldı |
| SERVER_ERROR | Sunucu hatası |
| INVALID_SHOP_ID | Geçersiz çark ID |
| INVALID_EMAIL | Geçersiz e-posta |
| NO_PRIZES | Ödül yok |

---

Bu rehber, React UI geliştirirken ihtiyacın olan tüm API bilgilerini içerir. Herhangi bir sorun olursa dokümantasyonu referans alabilirsin.
