import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { whatsappService } from '../services/whatsapp.service'
import { socketService } from '../services/socket.service'
import type { SendMessageRequest, BulkMessageRequest } from '../types/whatsapp.types'

const router = Router()

// Get all contacts
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const contacts = await whatsappService.getContacts(userId)
    res.json({ contacts })
  } catch (error: any) {
    console.error('Error getting contacts:', error)
    res.status(500).json({ error: 'Failed to get contacts' })
  }
})

// Get messages for a contact
router.get('/messages/:contactId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { contactId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const messages = await whatsappService.getMessages(userId, contactId)
    res.json({ messages })
  } catch (error: any) {
    console.error('Error getting messages:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

// Send message
router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { to, message, type = 'text', templateName, mediaUrl, caption }: SendMessageRequest = req.body

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const result = await whatsappService.sendMessage(userId, to, {
      to,
      message,
      type,
      templateName,
      mediaUrl,
      caption,
    })

    res.json({ success: true, result })
  } catch (error: any) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: error.message || 'Failed to send message' })
  }
})

// Mark messages as read
router.post('/read/:contactId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { contactId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    await whatsappService.markMessagesAsRead(userId, contactId)

    // Broadcast read status via socket
    socketService.broadcastMessageStatus(userId, contactId, 'read')

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
})

// Get unread count
router.get('/unread', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const count = await whatsappService.getUnreadCount(userId)
    res.json({ count })
  } catch (error: any) {
    console.error('Error getting unread count:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

// Get Çarkıfelek contacts (from wheel spins)
router.get('/contacts/carkifelek', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const contacts = await whatsappService.getCarkifelekContacts(userId)
    res.json({ contacts })
  } catch (error: any) {
    console.error('Error getting çarkıfelek contacts:', error)
    res.status(500).json({ error: 'Failed to get çarkıfelek contacts' })
  }
})

// Get contact stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const contacts = await whatsappService.getContacts(userId)
    const unreadCount = await whatsappService.getUnreadCount(userId)

    // Count active today (contacts with messages in last 24h)
    // This would be optimized with a proper query

    res.json({
      totalContacts: contacts.length,
      unreadCount,
      activeToday: 0, // To be implemented
    })
  } catch (error: any) {
    console.error('Error getting stats:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// Campaigns routes
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const { data } = await supabase
      .from('whatsapp_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    res.json({ campaigns: data || [] })
  } catch (error: any) {
    console.error('Error getting campaigns:', error)
    res.status(500).json({ error: 'Failed to get campaigns' })
  }
})

// Create campaign
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { name, message, contacts, scheduledFor } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const campaign = await whatsappService.createCampaign(
      userId,
      name,
      message,
      contacts,
      scheduledFor ? new Date(scheduledFor) : undefined
    )

    res.json({ campaign })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    res.status(500).json({ error: error.message || 'Failed to create campaign' })
  }
})

// Send campaign
router.post('/campaigns/:id/send', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    await whatsappService.sendBulkMessages(id)

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error sending campaign:', error)
    res.status(500).json({ error: error.message || 'Failed to send campaign' })
  }
})

export default router
