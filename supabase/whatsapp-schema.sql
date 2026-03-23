-- ============================================
-- WhatsApp Integration Schema (Fixed)
-- Foreign key constraints removed to work with existing shops table
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WHATSAPP CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- References shops.customer_id (Clerk user ID) - soft reference
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  profile_pic_url TEXT,
  blocked BOOLEAN DEFAULT false,
  tags TEXT[], -- e.g., ['çarkıfelek', 'vip', 'lead']
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WHATSAPP MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Soft reference to shops.customer_id
  contact_id UUID NOT NULL,
  message_id VARCHAR(100) UNIQUE, -- WhatsApp message ID
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'document', 'audio', 'template')),
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- image/jpeg, video/mp4, etc.
  file_name TEXT,
  file_size INTEGER,
  thumbnail_url TEXT,
  status TEXT CHECK (status IN ('queued', 'sent', 'failed', 'delivered', 'read', 'deleted')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key to contacts only
ALTER TABLE whatsapp_messages
  ADD CONSTRAINT fk_whatsapp_messages_contact
  FOREIGN KEY (contact_id)
  REFERENCES whatsapp_contacts(id) ON DELETE CASCADE;

-- ============================================
-- WHATSAPP CAMPAIGNS TABLE (Bulk Messaging)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Soft reference to shops.customer_id
  name VARCHAR(100) NOT NULL,
  template_name VARCHAR(100),
  message_content TEXT NOT NULL,
  target_contacts TEXT[] NOT NULL, -- Phone numbers
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')) DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WHATSAPP TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Soft reference to shops.customer_id
  template_name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- MARKETING, UTILITY, AUTHENTICATION
  language VARCHAR(10) DEFAULT 'tr',
  components JSONB, -- Template components structure
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  meta JSONB, -- Additional metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WHATSAPP SEPET REMINDERS (Cart Abandonment)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_sepet_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Soft reference to shops.customer_id
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE SET NULL,
  cart_value DECIMAL(10, 2),
  items JSONB, -- Cart items data
  abandoned_at TIMESTAMPTZ NOT NULL,
  reminder_1_sent BOOLEAN DEFAULT FALSE,
  reminder_1_sent_at TIMESTAMPTZ,
  reminder_2_sent BOOLEAN DEFAULT FALSE,
  reminder_2_sent_at TIMESTAMPTZ,
  reminder_3_sent BOOLEAN DEFAULT FALSE,
  reminder_3_sent_at TIMESTAMPTZ,
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  recovery_value DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_user_id ON whatsapp_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_tags ON whatsapp_contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_updated ON whatsapp_contacts(updated_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread ON whatsapp_messages(user_id, direction, status)
  WHERE direction = 'incoming' AND status = 'sent';

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_user_id ON whatsapp_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_scheduled ON whatsapp_campaigns(scheduled_for)
  WHERE status = 'scheduled';

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_user_id ON whatsapp_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);

-- Sepet reminders indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_sepet_reminders_user_id ON whatsapp_sepet_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sepet_reminders_abandoned ON whatsapp_sepet_reminders(abandoned_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sepet_reminders_contact_id ON whatsapp_sepet_reminders(contact_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON whatsapp_contacts;
CREATE TRIGGER update_whatsapp_contacts_updated_at BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_campaigns_updated_at ON whatsapp_campaigns;
CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sepet_reminders ENABLE ROW LEVEL SECURITY;

-- Contacts: Users can see their own contacts (based on user_id in shops table)
CREATE POLICY "Users can view own whatsapp_contacts"
  ON whatsapp_contacts
  FOR SELECT
  USING (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can insert own whatsapp_contacts"
  ON whatsapp_contacts
  FOR INSERT
  WITH CHECK (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can update own whatsapp_contacts"
  ON whatsapp_contacts
  FOR UPDATE
  USING (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can delete own whatsapp_contacts"
  ON whatsapp_contacts
  FOR DELETE
  USING (user_id IN (SELECT customer_id FROM shops));

-- Messages: Users can see their own messages
CREATE POLICY "Users can view own whatsapp_messages"
  ON whatsapp_messages
  FOR SELECT
  USING (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can insert own whatsapp_messages"
  ON whatsapp_messages
  FOR INSERT
  WITH CHECK (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can update own whatsapp_messages"
  ON whatsapp_messages
  FOR UPDATE
  USING (user_id IN (SELECT customer_id FROM shops));

-- Campaigns: Users can manage their own campaigns
CREATE POLICY "Users can view own whatsapp_campaigns"
  ON whatsapp_campaigns
  FOR SELECT
  USING (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can insert own whatsapp_campaigns"
  ON whatsapp_campaigns
  FOR INSERT
  WITH CHECK (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can update own whatsapp_campaigns"
  ON whatsapp_campaigns
  FOR UPDATE
  USING (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can delete own whatsapp_campaigns"
  ON whatsapp_campaigns
  FOR DELETE
  USING (user_id IN (SELECT customer_id FROM shops));

-- Templates: Users can manage their own templates
CREATE POLICY "Users can view own whatsapp_templates"
  ON whatsapp_templates
  FOR SELECT
  USING (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can insert own whatsapp_templates"
  ON whatsapp_templates
  FOR INSERT
  WITH CHECK (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can update own whatsapp_templates"
  ON whatsapp_templates
  FOR UPDATE
  USING (user_id IN (SELECT customer_id FROM shops));

-- Sepet reminders: Users can view their own reminders
CREATE POLICY "Users can view own whatsapp_sepet_reminders"
  ON whatsapp_sepet_reminders
  FOR SELECT
  USING (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can insert own whatsapp_sepet_reminders"
  ON whatsapp_sepet_reminders
  FOR INSERT
  WITH CHECK (user_id IN (SELECT customer_id FROM shops));

CREATE POLICY "Users can update own whatsapp_sepet_reminders"
  ON whatsapp_sepet_reminders
  FOR UPDATE
  USING (user_id IN (SELECT customer_id FROM shops));

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Get WhatsApp stats for a user
CREATE OR REPLACE FUNCTION get_whatsapp_stats(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_total_contacts BIGINT;
  v_unread_count BIGINT;
  v_messages_today BIGINT;
  v_messages_sent_today BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_contacts
  FROM whatsapp_contacts
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_unread_count
  FROM whatsapp_messages
  WHERE user_id = p_user_id
    AND direction = 'incoming'
    AND status = 'sent';

  SELECT COUNT(*) INTO v_messages_today
  FROM whatsapp_messages
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_messages_sent_today
  FROM whatsapp_messages
  WHERE user_id = p_user_id
    AND direction = 'outgoing'
    AND created_at >= CURRENT_DATE;

  RETURN json_build_object(
    'totalContacts', v_total_contacts,
    'unreadCount', v_unread_count,
    'messagesToday', v_messages_today,
    'messagesSentToday', v_messages_sent_today
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Contact with last message preview
CREATE OR REPLACE VIEW whatsapp_contact_last_message AS
SELECT
  c.id as contact_id,
  c.user_id,
  c.phone_number,
  c.full_name,
  c.profile_pic_url,
  c.tags,
  c.updated_at,
  m.content as last_message,
  m.message_type as last_message_type,
  m.created_at as last_message_at,
  m.direction as last_message_direction,
  m.status as last_message_status
FROM whatsapp_contacts c
LEFT JOIN LATERAL (
  SELECT *
  FROM whatsapp_messages
  WHERE contact_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) m ON true
ORDER BY c.updated_at DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE whatsapp_contacts IS 'WhatsApp contact list';
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp message history';
COMMENT ON TABLE whatsapp_campaigns IS 'Bulk messaging campaigns';
COMMENT ON TABLE whatsapp_templates IS 'WhatsApp message templates';
COMMENT ON TABLE whatsapp_sepet_reminders IS 'Cart abandonment reminders (Sepet Hatırlatma)';
