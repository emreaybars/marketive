import { Request, Response } from 'express'
import { whatsappService } from '../services/whatsapp.service'
import { whatsappAPI } from '../config/whatsapp'
import type { WebhookEntry } from '../types/whatsapp.types'

// Webhook verification endpoint (GET) - Meta will call this
export async function verifyWebhook(req: Request, res: Response) {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  const result = whatsappAPI.verifyWebhook(mode as string, token as string, challenge as string)

  if (result) {
    console.log('Webhook verified')
    res.status(200).send(result)
  } else {
    console.log('Webhook verification failed')
    res.sendStatus(403)
  }
}

// Webhook handler (POST) - Meta will send updates here
export async function handleWebhook(req: Request, res: Response) {
  try {
    const body = req.body as WebhookEntry[]

    console.log('Received webhook:', JSON.stringify(body, null, 2))

    // Process each entry
    for (const entry of body) {
      const userId = extractUserIdFromEntry(entry)

      if (userId) {
        await whatsappService.processWebhook(userId, entry)
      }
    }

    res.status(200).json({ status: 'received' })
  } catch (error) {
    console.error('Error handling webhook:', error)
    res.status(500).json({ error: 'Failed to process webhook' })
  }
}

// Helper to extract user_id from webhook entry
// This would use the phone number ID to look up the user
function extractUserIdFromEntry(entry: WebhookEntry): string | null {
  // Get phone number ID from metadata
  const phoneNumberId = entry.changes[0]?.value?.metadata?.phone_number_id

  if (!phoneNumberId) {
    return null
  }

  // In a real implementation, you would:
  // 1. Look up which user owns this phone number
  // 2. Return that user's ID
  // For now, we'll use a simplified approach
  // This should be implemented based on your business logic

  // TODO: Implement proper user lookup from phone_number_id
  // For now, this returns null (webhook won't be processed)
  return null
}
