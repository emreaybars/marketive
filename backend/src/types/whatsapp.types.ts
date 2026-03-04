// WhatsApp Types for Backend

export interface SendMessageRequest {
  to: string
  message: string
  type?: 'text' | 'template' | 'image' | 'video' | 'document'
  templateName?: string
  mediaUrl?: string
  caption?: string
}

export interface BulkMessageRequest {
  contacts: string[]
  message: string
  scheduledFor?: Date
}

export interface WebhookEntry {
  id: string
  changes: WebhookChange[]
}

export interface WebhookChange {
  field: string
  value: WebhookValue
}

export interface WebhookValue {
  messaging_product: string
  metadata: WebhookMetadata
  contacts?: WebhookContact[]
  messages: WebhookMessage[]
}

export interface WebhookMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface WebhookContact {
  profile: {
    name: string
  }
  wa_id: string
}

export interface WebhookMessage {
  from: string
  id: string
  timestamp: string
  text?: {
    body: string
  }
  image?: {
    caption?: string
    mime_type: string
    sha256: string
    id: string
  }
  video?: {
    caption?: string
    mime_type: string
    sha256: string
    id: string
  }
  document?: {
    caption?: string
    mime_type: string
    sha256: string
    id: string
    filename?: string
  }
  type?: string
  status?: string
}

export interface SocketMessage {
  type: 'message' | 'status' | 'contact' | 'error'
  data: any
}

export interface ContactStats {
  totalContacts: number
  activeToday: number
  unreadCount: number
}
