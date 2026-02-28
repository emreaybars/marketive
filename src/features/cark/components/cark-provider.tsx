'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { generateWidgetToken } from '@/lib/widget-token'
import { useUser } from '@clerk/clerk-react'

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qiiygcclanmgzlrcpmle.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Wheel {
  id: string
  shop_id: string
  name: string
  logo_url: string
  website_url: string
  brand_name: string
  contact_info_type: 'email' | 'phone'
  active: boolean
  created_at: string
  widget_settings?: {
    title: string
    description: string
    button_text: string
    background_color: string | null
    button_color: string | null
    title_color: string
    description_color: string
    show_on_load: boolean
    popup_delay: number
  }
  prizes?: Prize[]
  embed_code?: string
}

interface Prize {
  id: string
  name: string
  description: string
  redirect_url: string
  color: string
  chance: number
  coupon_codes: string
  display_order: number
  active: boolean
}

// Wheel spin result (won prize)
interface WheelSpinResult {
  id: string
  shop_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  prize_name: string
  coupon_code: string | null
  created_at: string
}

interface CreateWheelData {
  storeId: string
  storeName: string
  logoUrl: string
  websiteUrl: string
  brandName: string
  contactInfoType: 'email' | 'phone'
  widgetTitle: string
  widgetDescription: string
  buttonText: string
  backgroundColor: string
  buttonColor: string
  autoShow: boolean
  showDelay: number
  prizes: Array<{
    name: string
    description: string
    redirectUrl: string
    color: string
    chance: number
    couponCodes: string
  }>
}

// Analytics statistics
interface DailyStats {
  date: string
  spins: number
  emails: number
  phones: number
}

interface AnalyticsStats {
  totalEmails: number
  totalPhones: number
  totalSpins: number
  dailyStats: DailyStats[]
  todaySpins: number
  weekSpins: number
  changeFromLastWeek: number
}

interface CarkContextType {
  wheels: Wheel[]
  wheelSpins: WheelSpinResult[]
  loading: boolean
  analytics: AnalyticsStats | null
  createWheel: (data: CreateWheelData) => Promise<{ success: boolean; error?: string; wheel?: Wheel }>
  updateWheel: (id: string, data: Partial<Wheel>) => Promise<void>
  deleteWheel: (id: string) => Promise<void>
  refreshWheels: () => Promise<void>
  refreshWheelSpins: () => Promise<void>
  calculateAnalytics: () => void
}

const CarkContext = createContext<CarkContextType | undefined>(undefined)

export function CarkProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser()
  const [wheels, setWheels] = useState<Wheel[]>([])
  const [wheelSpins, setWheelSpins] = useState<WheelSpinResult[]>([])
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null)

  // Get Clerk user ID for Supabase queries
  const clerkUserId = user?.id

  // Fetch all wheels (shops) - SECURITY: Only user's own shops
  const refreshWheels = async () => {
    setLoading(true)
    try {
      // Wait for Clerk auth to load
      if (!isUserLoaded) {
        setLoading(false)
        return
      }

      if (!clerkUserId) {
        console.warn('Kullanıcı giriş yapmamış, çarklar yüklenemiyor')
        setWheels([])
        return
      }

      // Use RPC function to get user's shops (works with TEXT type)
      const { data, error } = await supabase
        .rpc('get_user_shops', { p_customer_id: clerkUserId })

      if (error) throw error

      // Parse JSONB results
      const wheels = (data || []).map((item: any) => {
        const wheel = typeof item === 'string' ? JSON.parse(item) : item
        return wheel
      })

      // Generate embed codes for each wheel
      const wheelsWithEmbed = await Promise.all(
        wheels.map(async (wheel: any) => {
          const token = await generateWidgetToken(wheel.shop_id, wheel.id)
          const domain = window.location.origin
          const embedCode = `<!-- Çarkıfelek Widget -->
<script id="carkifelek-widget-script"
  data-shop-token="${token}"
  src="${domain}/widget.js">
</script>`
          return {
            ...wheel,
            embed_code: embedCode,
            widget_settings: wheel.widget_settings
          }
        })
      )

      setWheels(wheelsWithEmbed)
    } catch (err) {
      console.error('Error fetching wheels:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create new wheel
  const createWheel = async (data: CreateWheelData) => {
    setLoading(true)
    try {
      // SECURITY: Check if user is authenticated via Clerk
      if (!clerkUserId) {
        return { success: false, error: 'Oturum açmanız gerekiyor' }
      }

      // 1. Create shop with customer_id (Clerk user ID)
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          shop_id: data.storeId,
          customer_id: clerkUserId, // SECURITY: Link to Clerk user
          name: data.storeName,
          logo_url: data.logoUrl,
          website_url: data.websiteUrl,
          brand_name: data.brandName,
          contact_info_type: data.contactInfoType,
          active: true
        })
        .select()
        .single()

      if (shopError) throw shopError

      // 2. Create widget settings
      const { error: widgetError } = await supabase
        .from('widget_settings')
        .insert({
          shop_id: shop.id,
          title: data.widgetTitle,
          description: data.widgetDescription,
          button_text: data.buttonText,
          background_color: data.backgroundColor,
          button_color: data.buttonColor,
          title_color: '#ffffff',
          description_color: '#ffffff',
          show_on_load: data.autoShow,
          popup_delay: data.showDelay
        })

      if (widgetError) throw widgetError

      // 3. Create prizes
      const prizes = data.prizes.map((prize, index) => ({
        shop_id: shop.id,
        name: prize.name,
        description: prize.description,
        redirect_url: prize.redirectUrl,
        color: prize.color,
        chance: prize.chance,
        coupon_codes: prize.couponCodes,
        display_order: index,
        active: true
      }))

      const { error: prizesError } = await supabase
        .from('prizes')
        .insert(prizes)

      if (prizesError) throw prizesError

      // 4. Generate embed code (widget ve admin aynı domain'de)
      const token = await generateWidgetToken(data.storeId, shop.id)
      const embedCode = `<!-- Çarkıfelek Widget -->
<script id="carkifelek-widget-script"
  data-shop-token="${token}"
  src="${window.location.origin}/widget.js">
</script>`

      // 5. Refresh list
      await refreshWheels()

      return {
        success: true,
        wheel: {
          ...shop,
          widget_settings: {
            title: data.widgetTitle,
            description: data.widgetDescription,
            button_text: data.buttonText,
            show_on_load: data.autoShow,
            popup_delay: data.showDelay
          },
          embed_code: embedCode
        }
      }
    } catch (err: any) {
      console.error('Error creating wheel:', err)
      return { success: false, error: err.message || 'Failed to create wheel' }
    } finally {
      setLoading(false)
    }
  }

  // Update wheel - SECURITY: Only user's own shops
  const updateWheel = async (id: string, data: Partial<Wheel>) => {
    setLoading(true)
    try {
      if (!clerkUserId) {
        throw new Error('Oturum açmanız gerekiyor')
      }

      // First, fetch the shop to check ownership
      const { data: shop } = await supabase
        .from('shops')
        .select('id, customer_id')
        .eq('id', id)
        .single()

      if (!shop || shop.customer_id !== clerkUserId) {
        throw new Error('Bu çarkı güncelleme yetkiniz yok')
      }

      // Update the shop
      const { error } = await supabase
        .from('shops')
        .update({
          name: data.name,
          logo_url: data.logo_url,
          website_url: data.website_url,
          brand_name: data.brand_name,
          active: data.active
        })
        .eq('id', id)

      if (error) throw error
      await refreshWheels()
    } catch (err) {
      console.error('Error updating wheel:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete wheel - SECURITY: Only user's own shops
  const deleteWheel = async (id: string) => {
    setLoading(true)
    try {
      if (!clerkUserId) {
        throw new Error('Oturum açmanız gerekiyor')
      }

      // First, fetch the shop to check ownership
      const { data: shop } = await supabase
        .from('shops')
        .select('id, customer_id')
        .eq('id', id)
        .single()

      if (!shop || shop.customer_id !== clerkUserId) {
        throw new Error('Bu çarkı silme yetkiniz yok')
      }

      // Delete the shop
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id)

      if (error) throw error
      await refreshWheels()
    } catch (err) {
      console.error('Error deleting wheel:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all wheel spin results - SECURITY: Only user's own shops' spins
  const refreshWheelSpins = async () => {
    setLoading(true)
    try {
      // Wait for Clerk auth to load
      if (!isUserLoaded || !clerkUserId) {
        console.warn('Kullanıcı giriş yapmamış')
        setWheelSpins([])
        return
      }

      // Use RPC function to get user's wheel spins
      const { data, error } = await supabase
        .rpc('get_user_wheel_spins', { p_customer_id: clerkUserId })

      if (error) throw error

      // Parse JSONB results and transform to match our interface
      const transformedData: WheelSpinResult[] = (data || []).map((item: any) => {
        const spin = typeof item === 'string' ? JSON.parse(item) : item
        return {
          id: spin.spin_id,  // RPC function returns spin_id
          shop_id: spin.shop_id,
          full_name: spin.full_name,
          email: spin.email,
          phone: spin.phone,
          prize_name: spin.prize_name || 'Bilinmeyen Ödül',
          coupon_code: spin.coupon_code,
          created_at: spin.won_at
        }
      })

      setWheelSpins(transformedData)
    } catch (err) {
      console.error('Error fetching wheel spins:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate analytics from wheel spins
  const calculateAnalytics = useCallback(() => {
    if (!wheelSpins || wheelSpins.length === 0) {
      setAnalytics({
        totalEmails: 0,
        totalPhones: 0,
        totalSpins: 0,
        dailyStats: [],
        todaySpins: 0,
        weekSpins: 0,
        changeFromLastWeek: 0
      })
      return
    }

    // Count emails and phones
    const totalEmails = wheelSpins.filter(s => s.email && s.email.trim() !== '').length
    const totalPhones = wheelSpins.filter(s => s.phone && s.phone.trim() !== '').length
    const totalSpins = wheelSpins.length

    // Group by date for daily stats
    const dailyMap = new Map<string, DailyStats>()

    wheelSpins.forEach(spin => {
      const date = new Date(spin.created_at)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        spins: 0,
        emails: 0,
        phones: 0
      }

      existing.spins++
      if (spin.email && spin.email.trim() !== '') existing.emails++
      if (spin.phone && spin.phone.trim() !== '') existing.phones++

      dailyMap.set(dateKey, existing)
    })

    // Convert map to array and sort by date
    const dailyStats = Array.from(dailyMap.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate today's spins
    const today = new Date().toISOString().split('T')[0]
    const todaySpins = wheelSpins.filter(s =>
      new Date(s.created_at).toISOString().split('T')[0] === today
    ).length

    // Calculate this week's spins (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekSpins = wheelSpins.filter(s => new Date(s.created_at) >= weekAgo).length

    // Calculate change from last week (previous 7 days)
    const twoWeeksAgo = new Date(weekAgo)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7)
    const lastWeekSpins = wheelSpins.filter(s => {
      const date = new Date(s.created_at)
      return date >= twoWeeksAgo && date < weekAgo
    }).length

    const changeFromLastWeek = lastWeekSpins > 0
      ? ((weekSpins - lastWeekSpins) / lastWeekSpins) * 100
      : weekSpins > 0 ? 100 : 0

    setAnalytics({
      totalEmails,
      totalPhones,
      totalSpins,
      dailyStats,
      todaySpins,
      weekSpins,
      changeFromLastWeek
    })
  }, [wheelSpins])

  // Fetch on mount and when user auth state changes
  useEffect(() => {
    // Only fetch if Clerk auth is loaded and user is logged in
    if (isUserLoaded && clerkUserId) {
      refreshWheels()
      refreshWheelSpins()
    }
  }, [isUserLoaded, clerkUserId])

  // Calculate analytics when wheelSpins changes
  useEffect(() => {
    calculateAnalytics()
  }, [wheelSpins, calculateAnalytics])

  return (
    <CarkContext.Provider value={{ wheels, wheelSpins, loading, analytics, createWheel, updateWheel, deleteWheel, refreshWheels, refreshWheelSpins, calculateAnalytics }}>
      {children}
    </CarkContext.Provider>
  )
}

export function useCark() {
  const context = useContext(CarkContext)
  if (!context) {
    throw new Error('useCark must be used within CarkProvider')
  }
  return context
}

// Export types for use in other components
export type { Wheel, Prize, CreateWheelData, WheelSpinResult, DailyStats, AnalyticsStats }
