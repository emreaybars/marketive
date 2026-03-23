-- ============================================
-- SPIN RATE LIMITING - Server Side
-- ============================================

-- 1. Spin rate limiting tablosu
CREATE TABLE IF NOT EXISTS spin_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    contact_hash TEXT NOT NULL, -- MD5 hash of contact (email/phone)
    ip_address TEXT,
    spin_count INTEGER DEFAULT 1,
    first_spin_at TIMESTAMPTZ DEFAULT now(),
    last_spin_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id, contact_hash)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_spin_rate_limits_lookup 
ON spin_rate_limits(shop_id, contact_hash);

CREATE INDEX IF NOT EXISTS idx_spin_rate_limits_cleanup 
ON spin_rate_limits(last_spin_at);

-- 2. RLS policies
ALTER TABLE spin_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Widget can insert rate limits" ON spin_rate_limits;
DROP POLICY IF EXISTS "Users can view own rate limits" ON spin_rate_limits;

-- Widget insert policy
CREATE POLICY "Widget can insert rate limits"
  ON spin_rate_limits FOR INSERT
  TO anon, authenticated
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

-- Users can view their shop's rate limits
CREATE POLICY "Users can view own rate limits"
  ON spin_rate_limits FOR SELECT
  TO authenticated
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- 3. Cleanup function - Remove old rate limit records (24+ hours)
CREATE OR REPLACE FUNCTION cleanup_spin_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM spin_rate_limits
  WHERE last_spin_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Check spin rate limit function
-- Bu fonksiyon hem kontrol yapar HEM kayıt oluşturur
CREATE OR REPLACE FUNCTION check_spin_rate_limit(
    p_shop_id UUID,
    p_contact TEXT,
    p_ip_address TEXT,
    p_max_spins INTEGER DEFAULT 1,
    p_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    can_spin BOOLEAN,
    remaining_spins INTEGER,
    time_until_reset INTEGER -- seconds
) AS $
DECLARE
    v_contact_hash TEXT;
    v_record RECORD;
    v_time_until_reset INTEGER;
BEGIN
    -- Create hash of contact
    v_contact_hash := MD5(LOWER(TRIM(p_contact)));
    
    -- Check existing record
    SELECT * INTO v_record
    FROM spin_rate_limits
    WHERE shop_id = p_shop_id
      AND contact_hash = v_contact_hash;
    
    -- No record found - can spin, INSERT new record
    IF NOT FOUND THEN
        INSERT INTO spin_rate_limits (shop_id, contact_hash, ip_address, spin_count, first_spin_at, last_spin_at)
        VALUES (p_shop_id, v_contact_hash, p_ip_address, 1, now(), now())
        ON CONFLICT (shop_id, contact_hash) DO NOTHING;
        
        RETURN QUERY SELECT true, p_max_spins - 1, 0::INTEGER;
        RETURN;
    END IF;
    
    -- Check if 24 hours passed since first spin - RESET
    IF v_record.first_spin_at < now() - (p_window_hours || ' hours')::interval THEN
        -- Reset window
        UPDATE spin_rate_limits
        SET spin_count = 1,
            first_spin_at = now(),
            last_spin_at = now()
        WHERE id = v_record.id;
        
        RETURN QUERY SELECT true, p_max_spins - 1, 0::INTEGER;
        RETURN;
    END IF;
    
    -- Check spin count within window
    IF v_record.spin_count >= p_max_spins THEN
        -- Calculate time until reset
        v_time_until_reset := EXTRACT(EPOCH FROM ((v_record.first_spin_at + (p_window_hours || ' hours')::interval) - now()))::INTEGER;
        
        RETURN QUERY SELECT false, 0, GREATEST(v_time_until_reset, 0)::INTEGER;
        RETURN;
    END IF;
    
    -- Can spin, increment count
    UPDATE spin_rate_limits
    SET spin_count = spin_count + 1,
        last_spin_at = now()
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT true, p_max_spins - v_record.spin_count - 1, 0::INTEGER;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Record spin rate limit function
CREATE OR REPLACE FUNCTION record_spin_rate_limit(
    p_shop_id UUID,
    p_contact TEXT,
    p_ip_address TEXT
)
RETURNS void AS $$
DECLARE
    v_contact_hash TEXT;
BEGIN
    v_contact_hash := MD5(LOWER(TRIM(p_contact)));
    
    INSERT INTO spin_rate_limits (shop_id, contact_hash, ip_address, spin_count)
    VALUES (p_shop_id, v_contact_hash, p_ip_address, 1)
    ON CONFLICT (shop_id, contact_hash)
    DO UPDATE SET
        spin_count = spin_rate_limits.spin_count + 1,
        last_spin_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_spin_rate_limit(UUID, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_spin_rate_limit(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_spin_rate_limits() TO authenticated;
