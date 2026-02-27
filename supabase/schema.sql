-- Supabase Migration Script for Çarkıfelek
-- PostgreSQL schema based on MySQL structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SHOPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_token VARCHAR(72),
  owner_type TEXT DEFAULT 'user' CHECK (owner_type IN ('user', 'token', 'api')),
  name VARCHAR(100) NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT NOT NULL,
  allowed_domains TEXT, -- JSON array of allowed domains
  brand_name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  brevo_api_key TEXT,
  brevo_list_id INTEGER,
  klaviyo_public_key TEXT,
  klaviyo_private_key TEXT,
  klaviyo_list_id TEXT,
  contact_info_type TEXT DEFAULT 'email' CHECK (contact_info_type IN ('email', 'phone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WIDGET SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS widget_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Çarkı Çevir<br>Hediyeni Kazan!',
  description VARCHAR(255) DEFAULT 'Hediyeni almak için hemen çarkı çevir.',
  button_text VARCHAR(50) DEFAULT 'ÇARKI ÇEVİR',
  background_color VARCHAR(20),
  button_color VARCHAR(20),
  button_text_color VARCHAR(20) DEFAULT '#ffffff',
  show_on_load BOOLEAN DEFAULT true,
  popup_delay INTEGER DEFAULT 2000,
  page_background_image TEXT,
  wheel_circle_image TEXT,
  content_background_image TEXT,
  title_color VARCHAR(7) DEFAULT '#ffffff',
  description_color VARCHAR(7) DEFAULT '#ffffff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id)
);

-- =============================================
-- PRIZES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  redirect_url TEXT NOT NULL,
  color VARCHAR(20) NOT NULL,
  chance INTEGER NOT NULL DEFAULT 10,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  coupon_codes TEXT, -- One coupon per line
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WHEEL SPINS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wheel_spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  result VARCHAR(100) NOT NULL,
  prize_type VARCHAR(50),
  prize_value VARCHAR(100),
  coupon_code VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  session_id VARCHAR(255),
  spin_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WHEEL WINS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wheel_wins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  coupon_code VARCHAR(50) NOT NULL,
  prize_type VARCHAR(50) NOT NULL,
  prize_value VARCHAR(100) NOT NULL,
  win_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used BOOLEAN DEFAULT false,
  used_date TIMESTAMPTZ,
  order_id VARCHAR(100)
);

-- =============================================
-- WIDGET VIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS widget_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WON PRIZES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS won_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  spin_id UUID REFERENCES wheel_spins(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  coupon_code VARCHAR(50),
  won_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used BOOLEAN DEFAULT false,
  used_date TIMESTAMPTZ
);

-- =============================================
-- COUPONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ANALYTICS CACHE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL,
  metric_value BIGINT DEFAULT 0,
  metric_date DATE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Shops indexes
CREATE INDEX IF NOT EXISTS idx_shops_shop_id ON shops(shop_id);
CREATE INDEX IF NOT EXISTS idx_shops_customer_id ON shops(customer_id);
CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(active);

-- Wheel spins indexes
CREATE INDEX IF NOT EXISTS idx_wheel_spins_shop_id ON wheel_spins(shop_id);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_email ON wheel_spins(email);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_spin_date ON wheel_spins(spin_date);

-- Wheel wins indexes
CREATE INDEX IF NOT EXISTS idx_wheel_wins_shop_id ON wheel_wins(shop_id);
CREATE INDEX IF NOT EXISTS idx_wheel_wins_email ON wheel_wins(email);
CREATE INDEX IF NOT EXISTS idx_wheel_wins_coupon_code ON wheel_wins(coupon_code);

-- Prizes indexes
CREATE INDEX IF NOT EXISTS idx_prizes_shop_id ON prizes(shop_id);
CREATE INDEX IF NOT EXISTS idx_prizes_active ON prizes(active);

-- Widget views indexes
CREATE INDEX IF NOT EXISTS idx_widget_views_shop_id ON widget_views(shop_id);
CREATE INDEX IF NOT EXISTS idx_widget_views_viewed_at ON widget_views(viewed_at);

-- Analytics cache indexes
CREATE INDEX IF NOT EXISTS idx_analytics_cache_shop_metric ON analytics_cache(shop_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_date ON analytics_cache(metric_date);

-- =============================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Users: Users can see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Shops: Users can see their own shops
CREATE POLICY "Users can view own shops" ON shops
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own shops" ON shops
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own shops" ON shops
  FOR UPDATE USING (auth.uid() = customer_id);

-- Other tables: Users can access their shop's data
CREATE POLICY "Users can view own shop widget_settings" ON widget_settings
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can modify own shop widget_settings" ON widget_settings
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shop prizes" ON prizes
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can modify own shop prizes" ON prizes
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shop wheel_spins" ON wheel_spins
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can insert own shop wheel_spins" ON wheel_spins
  FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shop wheel_wins" ON wheel_wins
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shop widget_views" ON widget_views
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can insert own shop widget_views" ON widget_views
  FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shop won_prizes" ON won_prizes
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shop analytics" ON analytics_cache
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shop coupons" ON coupons
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid())
  );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_settings_updated_at BEFORE UPDATE ON widget_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_cache_last_updated BEFORE UPDATE ON analytics_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE users IS 'Kullanıcılar tablosu';
COMMENT ON TABLE shops IS 'Mağaza/Çark sahipleri';
COMMENT ON TABLE widget_settings IS 'Çark widget görünüm ayarları';
COMMENT ON TABLE prizes IS 'Çark ödülleri';
COMMENT ON TABLE wheel_spins IS 'Çark dönüşleri';
COMMENT ON TABLE wheel_wins IS 'Kazanan ödüller';
COMMENT ON TABLE widget_views IS 'Widget görüntüleme kayıtları';
COMMENT ON TABLE won_prizes IS 'Kazanılan ödül detayları';
COMMENT ON TABLE coupons IS 'Kupon kodları';
COMMENT ON TABLE analytics_cache IS 'Analitik önbellek';
