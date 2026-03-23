-- ============================================
-- RATE LIMITING FONKSİYONUNU DÜZELT
-- Bu fonksiyon artık spin izni verdiğinde kayıt oluşturuyor
-- ============================================

-- Eski fonksiyonu sil
DROP FUNCTION IF EXISTS check_spin_rate_limit(UUID, TEXT, TEXT, INTEGER, INTEGER);

-- Yeni fonksiyonu oluştur
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
    time_until_reset INTEGER
) AS $$
DECLARE
    v_contact_hash TEXT;
    v_record RECORD;
    v_time_until_reset INTEGER;
BEGIN
    v_contact_hash := MD5(LOWER(TRIM(p_contact)));
    
    SELECT * INTO v_record
    FROM spin_rate_limits
    WHERE shop_id = p_shop_id
      AND contact_hash = v_contact_hash;
    
    -- YENİ: Kayıt yoksa ekle ve spin izni ver
    IF NOT FOUND THEN
        INSERT INTO spin_rate_limits (shop_id, contact_hash, ip_address, spin_count, first_spin_at, last_spin_at)
        VALUES (p_shop_id, v_contact_hash, p_ip_address, 1, now(), now())
        ON CONFLICT (shop_id, contact_hash) DO NOTHING;
        
        RETURN QUERY SELECT true, p_max_spins - 1, 0::INTEGER;
        RETURN;
    END IF;
    
    -- Pencere dolmuş mu kontrol et
    IF v_record.first_spin_at < now() - (p_window_hours || ' hours')::interval THEN
        UPDATE spin_rate_limits
        SET spin_count = 1, first_spin_at = now(), last_spin_at = now()
        WHERE id = v_record.id;
        
        RETURN QUERY SELECT true, p_max_spins - 1, 0::INTEGER;
        RETURN;
    END IF;
    
    -- Spin sayısını kontrol et
    IF v_record.spin_count >= p_max_spins THEN
        v_time_until_reset := EXTRACT(EPOCH FROM ((v_record.first_spin_at + (p_window_hours || ' hours')::interval) - now()))::INTEGER;
        RETURN QUERY SELECT false, 0, GREATEST(v_time_until_reset, 0)::INTEGER;
        RETURN;
    END IF;
    
    -- Spin sayısını artır
    UPDATE spin_rate_limits
    SET spin_count = spin_count + 1, last_spin_at = now()
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT true, p_max_spins - v_record.spin_count - 1, 0::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İzinleri güncelle
GRANT EXECUTE ON FUNCTION check_spin_rate_limit(UUID, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
