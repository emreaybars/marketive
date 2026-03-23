-- ============================================
-- TEMİZLİK: Duplicate wheel_spins kayıtlarını temizle
-- Bu sorgu aynı e-posta veya telefon ile birden fazla kaydı olanları bulur
-- ve sadece en eski kayıtları tutar
-- ============================================

-- Önce mevcut durumu kontrol et
SELECT 
    shop_id,
    COALESCE(email, phone) as contact,
    COUNT(*) as spin_count,
    MIN(created_at) as first_spin,
    MAX(created_at) as last_spin
FROM wheel_spins
GROUP BY shop_id, COALESCE(email, phone)
HAVING COUNT(*) > 1
ORDER BY spin_count DESC
LIMIT 20;

-- ============================================
-- DUPLICATE KAYITLARI TEMİZLE
-- Sadece her e-posta/telefon için EN ESKİ kaydı tut
-- ============================================

-- Email için duplicate temizliği
DELETE FROM wheel_spins
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY shop_id, email ORDER BY created_at ASC) as rn
        FROM wheel_spins
        WHERE email IS NOT NULL
    ) t
    WHERE rn > 1
);

-- Phone için duplicate temizliği
DELETE FROM wheel_spins
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY shop_id, phone ORDER BY created_at ASC) as rn
        FROM wheel_spins
        WHERE phone IS NOT NULL
          AND email IS NULL
    ) t
    WHERE rn > 1
);

-- ============================================
-- WON_PRIZES TABLOSUNU DA TEMİZLE
-- (Aynı email/phone ile birden fazla kazanan olabilir)
-- ============================================

-- Email için
DELETE FROM won_prizes
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY shop_id, email ORDER BY created_at ASC) as rn
        FROM won_prizes
        WHERE email IS NOT NULL
    ) t
    WHERE rn > 1
);

-- Phone için
DELETE FROM won_prizes
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY shop_id, phone ORDER BY created_at ASC) as rn
        FROM won_prizes
        WHERE phone IS NOT NULL
    ) t
    WHERE rn > 1
);

-- ============================================
-- SPIN_RATE_LIMITS tablosunu da temizle
-- (Eski kayıtları 24 saat sonra temizle)
-- ============================================

-- 24 saatten eski kayıtları temizle
DELETE FROM spin_rate_limits
WHERE last_spin_at < now() - interval '24 hours';

-- ============================================
-- Son durumu kontrol et
-- ============================================

SELECT 
    'wheel_spins' as table_name,
    COUNT(*) as total_records
FROM wheel_spins
UNION ALL
SELECT 
    'won_prizes',
    COUNT(*)
FROM won_prizes
UNION ALL
SELECT 
    'spin_rate_limits',
    COUNT(*)
FROM spin_rate_limits;
