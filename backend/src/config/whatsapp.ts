// WhatsApp Meta Cloud API Configuration
// Using axios directly for Meta Cloud API calls

import axios from 'axios'

export interface WhatsAppConfig {
  phoneNumberId: string
  businessAccountId: string
  accessToken: string
  webhookVerifyToken: string
  webhookSecret: string
  apiVersion: string
}

const config: WhatsAppConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
  apiVersion: 'v18.0',
}

// Validate config
export const isConfigured = !!(
  config.phoneNumberId &&
  config.accessToken
)

if (!isConfigured) {
  console.warn('WhatsApp credentials not properly configured.')
}

// Meta Graph API base URL
const META_API_BASE = 'https://graph.facebook.com'

// Helper function to make Meta API calls
export async function callMetaAPI(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  data?: any
) {
  const url = `${META_API_BASE}/${config.apiVersion}${endpoint}`

  const headers = {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
  }

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
    })
    return response.data
  } catch (error: any) {
    console.error('Meta API Error:', error.response?.data || error.message)
    throw error.response?.data || error
  }
}

// WhatsApp specific API calls
export const whatsappAPI = {
  // Send text message
  async sendTextMessage(to: string, message: string) {
    return callMetaAPI(`/${config.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: message },
      type: 'text',
    })
  },

  // Send template message
  async sendTemplateMessage(to: string, templateName: string, language: string = 'tr', components?: any[]) {
    return callMetaAPI(`/${config.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: components || [],
      },
    })
  },

  // Send media message
  async sendMediaMessage(to: string, mediaType: 'image' | 'video' | 'document', mediaUrl: string, caption?: string) {
    return callMetaAPI(`/${config.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to: to,
      type: mediaType,
      [mediaType]: {
        link: mediaUrl,
        ...(caption && { caption }),
      },
    })
  },

  // Mark message as read
  async markAsRead(messageId: string) {
    return callMetaAPI(`/${config.phoneNumberId}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    })
  },

  // Get message info
  async getMessageStatus(messageId: string) {
    return callMetaAPI(`/${messageId}`, 'GET')
  },

  // Get business phone number info
  async getPhoneNumberInfo() {
    return callMetaAPI(`/${config.phoneNumberId}`, 'GET')
  },

  // Verify webhook
  verifyWebhook(mode: string, token: string, challenge: string) {
    if (token === config.webhookVerifyToken) {
      return challenge
    }
    return null
  },
}

export default config
