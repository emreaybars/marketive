-- ============================================
-- ADD widget_position COLUMN TO widget_settings
-- ============================================

-- Add widget_position column if it doesn't exist
ALTER TABLE widget_settings
ADD COLUMN IF NOT EXISTS widget_position TEXT DEFAULT 'middle-right';

-- Add button_text_color column if it doesn't exist
ALTER TABLE widget_settings
ADD COLUMN IF NOT EXISTS button_text_color TEXT DEFAULT '#ffffff';
