'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface WhatsAppCampaign {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  sent: number
  delivered: number
  opened: number
  clicked: number
  created_at: string
}

interface WhatsAppMessage {
  id: string
  phone: string
  message: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  sent_at: string
}

interface DailyStats {
  date: string
  sent: number
  delivered: number
  read: number
}

interface AnalyticsStats {
  totalSent: number
  totalDelivered: number
  totalRead: number
  totalClicked: number
  dailyStats: DailyStats[]
  todaySent: number
  weekSent: number
  changeFromLastWeek: number
}

interface WhatsAppContact {
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

interface WhatsAppContextType {
  campaigns: WhatsAppCampaign[]
  messages: WhatsAppMessage[]
  loading: boolean
  analytics: AnalyticsStats | null
  contacts: WhatsAppContact[]
  refreshCampaigns: () => Promise<void>
  refreshMessages: () => Promise<void>
  calculateAnalytics: () => void
  setActiveContact: (contact: WhatsAppContact | null) => void
  getCarkifelekContacts: () => Promise<WhatsAppContact[]>
  createCampaign: (data: {
    name: string
    message: string
    contacts: string[]
    scheduledFor?: Date
  }) => Promise<void>
  campaignsLoading: boolean
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined)

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([])
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null)
  const [contacts, _setContacts] = useState<WhatsAppContact[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [_activeContact, setActiveContact] = useState<WhatsAppContact | null>(null)

  const refreshCampaigns = async () => {
    setLoading(true)
    try {
      // Fetch from API - currently empty
      setCampaigns([])
    } catch (err) {
      console.error('Error fetching campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshMessages = async () => {
    try {
      // Fetch from API - currently empty
      setMessages([])
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  const getCarkifelekContacts = async (): Promise<WhatsAppContact[]> => {
    // Return mock data for now
    return []
  }

  const createCampaign = async (_data: {
    name: string
    message: string
    contacts: string[]
    scheduledFor?: Date
  }) => {
    setCampaignsLoading(true)
    try {
      // TODO: Implement campaign creation
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (err) {
      console.error('Error creating campaign:', err)
      throw err
    } finally {
      setCampaignsLoading(false)
    }
  }

  const calculateAnalytics = useCallback(() => {
    if (!campaigns || campaigns.length === 0) {
      setAnalytics({
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalClicked: 0,
        dailyStats: [],
        todaySent: 0,
        weekSent: 0,
        changeFromLastWeek: 0,
      })
      return
    }

    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
    const totalRead = campaigns.reduce((sum, c) => sum + c.opened, 0)
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0)

    // Group by date for daily stats
    const dailyMap = new Map<string, DailyStats>()

    campaigns.forEach(campaign => {
      const date = new Date(campaign.created_at)
      const dateKey = date.toISOString().split('T')[0]

      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        sent: 0,
        delivered: 0,
        read: 0,
      }

      existing.sent += campaign.sent
      existing.delivered += campaign.delivered
      existing.read += campaign.opened

      dailyMap.set(dateKey, existing)
    })

    const dailyStats = Array.from(dailyMap.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const today = new Date().toISOString().split('T')[0]
    const todaySent = campaigns
      .filter(c => new Date(c.created_at).toISOString().split('T')[0] === today)
      .reduce((sum, c) => sum + c.sent, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekSent = campaigns
      .filter(c => new Date(c.created_at) >= weekAgo)
      .reduce((sum, c) => sum + c.sent, 0)

    const twoWeeksAgo = new Date(weekAgo)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7)
    const lastWeekSent = campaigns
      .filter(c => {
        const date = new Date(c.created_at)
        return date >= twoWeeksAgo && date < weekAgo
      })
      .reduce((sum, c) => sum + c.sent, 0)

    const changeFromLastWeek = lastWeekSent > 0
      ? ((weekSent - lastWeekSent) / lastWeekSent) * 100
      : weekSent > 0 ? 100 : 0

    setAnalytics({
      totalSent,
      totalDelivered,
      totalRead,
      totalClicked,
      dailyStats,
      todaySent,
      weekSent,
      changeFromLastWeek,
    })
  }, [campaigns])

  useEffect(() => {
    refreshCampaigns()
    refreshMessages()
  }, [])

  useEffect(() => {
    calculateAnalytics()
  }, [calculateAnalytics])

  return (
    <WhatsAppContext.Provider
      value={{
        campaigns,
        messages,
        loading,
        analytics,
        contacts,
        refreshCampaigns,
        refreshMessages,
        calculateAnalytics,
        setActiveContact,
        getCarkifelekContacts,
        createCampaign,
        campaignsLoading,
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

export type { WhatsAppCampaign, WhatsAppMessage, DailyStats, AnalyticsStats }
