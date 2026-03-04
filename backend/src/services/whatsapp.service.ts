import { supabase, whatsappTables, type WhatsAppMessage, type WhatsAppContact, type WhatsAppCampaign } from '../config/supabase'
import { whatsappAPI, isConfigured } from '../config/whatsapp'
import type { SendMessageRequest, WebhookMessage, WebhookEntry, WebhookContact } from '../types/whatsapp.types'

export class WhatsAppService {
  // Get or create contact from webhook data
  async getOrCreateContact(userId: string, phone: string, contactData?: WebhookContact): Promise<WhatsAppContact> {
    try {
      // Normalize phone number (remove +, spaces, dashes)
      const normalizedPhone = phone.replace(/[\s\-\+]/g, '')

      // Check if contact exists
      const { data: existingContact } = await supabase
        .from(whatsappTables.contacts)
        .select('*')
        .eq('user_id', userId)
        .eq('phone_number', normalizedPhone)
        .single()

      if (existingContact) {
        return existingContact
      }

      // Create new contact
      const { data: newContact, error } = await supabase
        .from(whatsappTables.contacts)
        .insert({
          user_id: userId,
          phone_number: normalizedPhone,
          full_name: contactData?.profile?.name || null,
          blocked: false,
          tags: [],
        })
        .select()
        .single()

      if (error) throw error
      return newContact
    } catch (error) {
      console.error('Error in getOrCreateContact:', error)
      throw error
    }
  }

  // Save message (incoming or outgoing)
  async saveMessage(
    userId: string,
    contactId: string,
    message: WebhookMessage,
    direction: 'incoming' | 'outgoing'
  ): Promise<WhatsAppMessage> {
    try {
      let messageType: 'text' | 'image' | 'video' | 'document' | 'template' = 'text'
      let content = ''
      let mediaUrl: string | null = null

      // Parse message content
      if (message.text) {
        content = message.text.body
        messageType = 'text'
      } else if (message.image) {
        content = message.image.caption || ''
        mediaUrl = message.image.id
        messageType = 'image'
      } else if (message.video) {
        content = message.video.caption || ''
        mediaUrl = message.video.id
        messageType = 'video'
      } else if (message.document) {
        content = message.document.caption || message.document.filename || ''
        mediaUrl = message.document.id
        messageType = 'document'
      } else if (message.type === 'template') {
        messageType = 'template'
      }

      const { data, error } = await supabase
        .from(whatsappTables.messages)
        .insert({
          user_id: userId,
          contact_id: contactId,
          message_id: message.id,
          direction,
          message_type: messageType,
          content,
          media_url: mediaUrl,
          status: 'sent',
          received_at: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving message:', error)
      throw error
    }
  }

  // Send message via WhatsApp API
  async sendMessage(userId: string, phoneNumber: string, request: SendMessageRequest): Promise<any> {
    if (!isConfigured) {
      throw new Error('WhatsApp is not configured')
    }

    try {
      // Get contact
      const { data: contact } = await supabase
        .from(whatsappTables.contacts)
        .select('*')
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber.replace(/[\s\-\+]/g, ''))
        .single()

      if (!contact) {
        throw new Error('Contact not found')
      }

      let result
      const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`

      switch (request.type) {
        case 'text':
          result = await whatsappAPI.sendTextMessage(normalizedPhone, request.message)
          break
        case 'template':
          result = await whatsappAPI.sendTemplateMessage(normalizedPhone, request.templateName!)
          break
        case 'image':
        case 'video':
        case 'document':
          result = await whatsappAPI.sendMediaMessage(normalizedPhone, request.type!, request.mediaUrl!, request.caption)
          break
        default:
          result = await whatsappAPI.sendTextMessage(normalizedPhone, request.message)
      }

      // Save sent message to database
      const messageId = result?.messages?.[0]?.id
      if (messageId) {
        await this.saveMessage(userId, contact.id, {
          id: messageId,
          from: contact.phone_number,
          timestamp: Math.floor(Date.now() / 1000).toString(),
        }, 'outgoing')
      }

      // Mark as sent in database
      if (messageId) {
        await supabase
          .from(whatsappTables.messages)
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('message_id', messageId)
      }

      return result
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Get contacts for user
  async getContacts(userId: string): Promise<WhatsAppContact[]> {
    try {
      const { data, error } = await supabase
        .from(whatsappTables.contacts)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting contacts:', error)
      throw error
    }
  }

  // Get messages for a contact
  async getMessages(userId: string, contactId: string, limit = 50): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from(whatsappTables.messages)
        .select('*')
        .eq('user_id', userId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []).reverse()
    } catch (error) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  // Get unread message count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(whatsappTables.messages)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('direction', 'incoming')
        .eq('status', 'sent')
        .not('status', 'eq', 'read')

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  // Get contacts from Çarkıfelek wheel spins (phone numbers)
  async getCarkifelekContacts(userId: string): Promise<WhatsAppContact[]> {
    try {
      // Get phone numbers from won_prizes where phone is not null
      const { data: wheelSpins } = await supabase
        .from('won_prizes')
        .select('phone, full_name, created_at')
        .not('phone', 'is', null)
        .not('status', 'eq', 'used') // Only unused coupons
        .order('created_at', { ascending: false })
        .limit(100)

      if (!wheelSpins || wheelSpins.length === 0) {
        return []
      }

      // Get existing contacts
      const { data: existingContacts } = await supabase
        .from(whatsappTables.contacts)
        .select('phone_number')
        .eq('user_id', userId)

      const existingPhones = new Set(existingContacts?.map(c => c.phone_number) || [])

      // Create new contacts from wheel spins
      const newContacts = wheelSpins
        .filter(spin => !existingPhones.has(spin.phone!.replace(/[\s\-\+]/g, '')))
        .map(spin => ({
          user_id: userId,
          phone_number: spin.phone!.replace(/[\s\-\+]/g, ''),
          full_name: spin.full_name || null,
          blocked: false,
          tags: ['çarkıfelek'],
        }))

      if (newContacts.length > 0) {
        const { data: created } = await supabase
          .from(whatsappTables.contacts)
          .insert(newContacts)
          .select()

        return created || []
      }

      return []
    } catch (error) {
      console.error('Error getting çarkıfelek contacts:', error)
      throw error
    }
  }

  // Mark messages as read
  async markMessagesAsRead(userId: string, contactId: string): Promise<void> {
    try {
      // Get unread messages
      const { data: unreadMessages } = await supabase
        .from(whatsappTables.messages)
        .select('message_id')
        .eq('user_id', userId)
        .eq('contact_id', contactId)
        .eq('direction', 'incoming')
        .eq('status', 'sent')
        .limit(100)

      if (!unreadMessages || unreadMessages.length === 0) {
        return
      }

      // Update status in database
      await supabase
        .from(whatsappTables.messages)
        .update({ status: 'read' })
        .eq('user_id', userId)
        .eq('contact_id', contactId)
        .eq('direction', 'incoming')
        .eq('status', 'sent')

      // Mark as read in WhatsApp (optional, can be rate limited)
      for (const msg of unreadMessages) {
        if (msg.message_id) {
          try {
            await whatsappAPI.markAsRead(msg.message_id)
          } catch (err) {
            console.error('Error marking message as read in WhatsApp:', err)
          }
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  }

  // Process webhook entry
  async processWebhook(userId: string, entry: WebhookEntry): Promise<void> {
    try {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const value = change.value
          const contacts = value.contacts?.[0]

          if (!contacts) continue

          // Get or create contact
          const contact = await this.getOrCreateContact(userId, contacts.wa_id, contacts)

          // Process messages
          for (const message of value.messages) {
            // Skip status updates
            if (message.status) continue

            // Skip if message is from the business (outgoing)
            if (message.from === value.metadata.display_phone_number) continue

            // Save incoming message
            await this.saveMessage(userId, contact.id, message, 'incoming')
          }
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      throw error
    }
  }

  // Create bulk message campaign
  async createCampaign(
    userId: string,
    name: string,
    message: string,
    phoneNumbers: string[],
    scheduledFor?: Date
  ): Promise<WhatsAppCampaign> {
    try {
      const { data, error } = await supabase
        .from(whatsappTables.campaigns)
        .insert({
          user_id: userId,
          name,
          template_name: 'custom',
          message_content: message,
          target_contacts: phoneNumbers,
          status: scheduledFor ? 'scheduled' : 'draft',
          scheduled_for: scheduledFor?.toISOString() || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  }

  // Send bulk messages (for campaigns)
  async sendBulkMessages(campaignId: string): Promise<void> {
    try {
      // Get campaign
      const { data: campaign } = await supabase
        .from(whatsappTables.campaigns)
        .select('*')
        .eq('id', campaignId)
        .single()

      if (!campaign) {
        throw new Error('Campaign not found')
      }

      // Update status to sending
      await supabase
        .from(whatsappTables.campaigns)
        .update({ status: 'sending' })
        .eq('id', campaignId)

      // Send messages to each contact
      let sentCount = 0
      for (const phone of campaign.target_contacts) {
        try {
          await this.sendMessage(campaign.user_id, phone, {
            to: phone,
            message: campaign.message_content,
            type: 'text',
          })
          sentCount++
        } catch (err) {
          console.error(`Failed to send to ${phone}:`, err)
        }
      }

      // Update campaign status
      await supabase
        .from(whatsappTables.campaigns)
        .update({
          status: 'completed',
          sent_count: sentCount,
        })
        .eq('id', campaignId)
    } catch (error) {
      console.error('Error sending bulk messages:', error)
      throw error
    }
  }
}

export const whatsappService = new WhatsAppService()
