import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key are required')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Database types
export interface WhatsAppContact {
  id: string
  user_id: string
  phone_number: string
  full_name: string | null
  profile_pic_url: string | null
  blocked: boolean
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface WhatsAppMessage {
  id: string
  user_id: string
  contact_id: string
  message_id: string | null
  direction: 'incoming' | 'outgoing'
  message_type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'template'
  content: string
  media_url: string | null
  status: 'sent' | 'delivered' | 'read' | 'failed'
  sent_at: string | null
  received_at: string | null
  created_at: string
}

export interface WhatsAppCampaign {
  id: string
  user_id: string
  name: string
  template_name: string
  message_content: string
  target_contacts: string[]
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduled_for: string | null
  sent_count: number
  delivered_count: number
  read_count: number
  created_at: string
}

export const whatsappTables = {
  contacts: 'whatsapp_contacts',
  messages: 'whatsapp_messages',
  campaigns: 'whatsapp_campaigns',
  templates: 'whatsapp_templates',
}
