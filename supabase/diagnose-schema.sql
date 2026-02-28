-- ============================================
-- Schema Check - Run this first
-- ============================================

-- Check won_prizes table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'won_prizes'
AND column_name IN ('shop_id', 'id', 'prize_id')
ORDER BY ordinal_position;

-- Check shops table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shops'
AND column_name IN ('id', 'shop_id', 'customer_id')
ORDER BY ordinal_position;
