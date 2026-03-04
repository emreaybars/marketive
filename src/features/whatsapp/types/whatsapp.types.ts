// WhatsApp Types for Frontend

export interface WhatsAppContact {
  id: string
  user_id: string
  phone_number: string
  full_name: string | null
  profile_pic_url: string | null
  blocked: boolean
  tags: string[] | null
  notes: string | null
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
  media_type: string | null
  file_name: string | null
  file_size: number | null
  thumbnail_url: string | null
  status: 'queued' | 'sent' | 'failed' | 'delivered' | 'read' | 'deleted'
  error_message: string | null
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
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled'
  scheduled_for: string | null
  sent_at: string | null
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface WhatsAppStats {
  totalContacts: number
  unreadCount: number
  messagesToday: number
  messagesSentToday: number
  onlineUsers: number
}

export interface SocketMessage {
  type: 'message' | 'status' | 'error' | 'typing'
  data: any
}

export interface SendMessageRequest {
  to: string
  message: string
  type?: 'text' | 'template' | 'image' | 'video' | 'document'
  templateName?: string
  mediaUrl?: string
  caption?: string
}
