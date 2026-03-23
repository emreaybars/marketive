'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useUser } from '@/context/auth-provider'
import type { WhatsAppContact, WhatsAppMessage, WhatsAppCampaign, WhatsAppStats } from '../types/whatsapp.types'
import type { SendMessageRequest } from '../types/whatsapp.types'

const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3001'

interface WhatsAppContextType {
  contacts: WhatsAppContact[]
  messages: Map<string, WhatsAppMessage[]>
  campaigns: WhatsAppCampaign[]
  stats: WhatsAppStats | null
  activeContact: WhatsAppContact | null
  contactsLoading: boolean
  messagesLoading: boolean
  campaignsLoading: boolean
  fetchContacts: () => Promise<void>
  fetchMessages: (contactId: string) => Promise<void>
  sendMessage: (request: SendMessageRequest) => Promise<void>
  markAsRead: (contactId: string) => Promise<void>
  setActiveContact: (contact: WhatsAppContact | null) => void
  fetchCampaigns: () => Promise<void>
  createCampaign: (data: {
    name: string
    message: string
    contacts: string[]
    scheduledFor?: Date
  }) => Promise<void>
  getCarkifelekContacts: () => Promise<WhatsAppContact[]>
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined)

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser()
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [messages, setMessages] = useState<Map<string, WhatsAppMessage[]>>(new Map())
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([])
  const [stats, setStats] = useState<WhatsAppStats | null>(null)
  const [activeContact, setActiveContact] = useState<WhatsAppContact | null>(null)

  const [contactsLoading, setContactsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [campaignsLoading, setCampaignsLoading] = useState(false)

  const userId = user?.id

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!userId) return

    setContactsLoading(true)
    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/contacts`, {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch contacts')

      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setContactsLoading(false)
    }
  }, [userId])

  // Fetch messages for a contact
  const fetchMessages = useCallback(async (contactId: string) => {
    if (!userId) return

    setMessagesLoading(true)
    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/messages/${contactId}`, {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch messages')

      const data = await response.json()
      setMessages(prev => new Map(prev).set(contactId, data.messages || []))
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }, [userId])

  // Send message
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    if (!userId) return

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

      // Refresh messages for this contact
      if (activeContact) {
        await fetchMessages(activeContact.id)
      }

      return data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [userId, activeContact, fetchMessages])

  // Mark messages as read
  const markAsRead = useCallback(async (contactId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/read/${contactId}`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to mark as read')

      // Update local state
      setMessages(prev => {
        const newMap = new Map(prev)
        const msgs = newMap.get(contactId) || []
        newMap.set(
          contactId,
          msgs.map(m => ({ ...m, status: 'read' as const }))
        )
        return newMap
      })

      // Update stats
      if (stats) {
        setStats({ ...stats, unreadCount: 0 })
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [userId, stats])

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!userId) return

    setCampaignsLoading(true)
    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/campaigns`, {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch campaigns')

      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setCampaignsLoading(false)
    }
  }, [userId])

  // Create campaign
  const createCampaign = useCallback(async (data: {
    name: string
    message: string
    contacts: string[]
    scheduledFor?: Date
  }) => {
    if (!userId) return

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/campaigns`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create campaign')

      await fetchCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  }, [userId, fetchCampaigns])

  // Get Çarkıfelek contacts
  const getCarkifelekContacts = useCallback(async (): Promise<WhatsAppContact[]> => {
    if (!userId) return []

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/contacts/carkifelek`, {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch çarkıfelek contacts')

      const data = await response.json()
      return data.contacts || []
    } catch (error) {
      console.error('Error fetching çarkıfelek contacts:', error)
      return []
    }
  }, [userId])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/stats`, {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [userId])

  // Initial fetch
  useEffect(() => {
    if (isLoaded && userId) {
      fetchContacts()
      fetchCampaigns()
      fetchStats()
    }
  }, [isLoaded, userId, fetchContacts, fetchCampaigns, fetchStats])

  return (
    <WhatsAppContext.Provider
      value={{
        contacts,
        messages,
        campaigns,
        stats,
        activeContact,
        contactsLoading,
        messagesLoading,
        campaignsLoading,
        fetchContacts,
        fetchMessages,
        sendMessage,
        markAsRead,
        setActiveContact,
        fetchCampaigns,
        createCampaign,
        getCarkifelekContacts,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  )
}

export function useWhatsApp() {
  const context = useContext(WhatsAppContext)
  if (!context) {
    throw new Error('useWhatsApp must be used within WhatsAppProvider')
  }
  return context
}

// Alias for chat functionality
export { useWhatsApp as useWhatsAppChat, WhatsAppProvider as WhatsAppChatProvider }
