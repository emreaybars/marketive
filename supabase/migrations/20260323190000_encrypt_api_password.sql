-- ============================================
-- API PASSWORD ŞİFRELEME - Güvenlik iyileştirmesi
-- ============================================

-- pgcrypto uzantısını aktif et (genelde Supabase'te yüklüdür)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- api_password sütununu şifreli hale getir
-- Önce mevcut düz metin şifreleri şifreleyelim
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, api_password FROM shop_integrations WHERE api_password IS NOT NULL AND api_password != '' LOOP
    -- Şifrelenmiş formata çevir: pgp_sym_encrypt şifreler
    UPDATE shop_integrations
    SET api_password = encode(pgp_sym_encrypt(rec.api_password, 'your-encryption-key-here'), 'base64')
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Sütun tipini değiştir (comment ekle)
COMMENT ON COLUMN shop_integrations.api_password IS 'API şifresi (AES şifreli) - Not: Gerçek production için farklı key kullanın';
