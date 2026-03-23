-- ============================================
-- API PASSWORD ŞİFRELEME - pgcrypto ile
-- ============================================

-- pgcrypto uzantısını aktif et
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Şifreleme için fonksiyonlar
CREATE OR REPLACE FUNCTION encrypt_api_password(plain_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Supabase'in JWT secret'i ile şifrele (production için farklı key kullanın)
  -- Şu an demo amaçlı, production'da environment variable'den key alınmalı
  RETURN encode(
    pgp_sym_encrypt(plain_text, current_setting('app.jwt_secret')::text, 'cipher-algo=aes256'),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_api_password(encrypted_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    current_setting('app.jwt_secret')::text,
    'cipher-algo=aes256'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut düz metin şifreleri şifrele (bir kereliğine)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, api_password FROM shop_integrations
            WHERE api_password IS NOT NULL
            AND api_password NOT LIKE '%' -- Zaten şifrelenmemiş olanlar
            AND length(api_password) < 100
  LOOP
    UPDATE shop_integrations
    SET api_password = encrypt_api_password(rec.api_password)
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Comment
COMMENT ON COLUMN shop_integrations.api_password IS 'API şifresi - AES-256 şifreli, sadece server-side çözülebilir';
