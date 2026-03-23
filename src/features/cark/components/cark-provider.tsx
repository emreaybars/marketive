'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase-client'
import { generateWidgetEmbedCode } from '@/lib/widget-token'
import { useUser } from '@/context/auth-provider'

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
  api_key?: string
  widget_settings?: {
    title: string
    description: string
    button_text: string
    background_color: string | null
    button_color: string | null
    button_text_color: string
    title_color: string
    description_color: string
    show_on_load: boolean
    popup_delay: number
    widget_position?: string
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

interface ShopIntegration {
  id: string
  shop_id: string
  platform_type: 'ikas' | 'ticimax' | 'shopify' | 'custom'
  api_username: string | null  // Görünebilir
  // api_password frontend'de görülmez - güvenlik
  store_name: string | null
  is_active: boolean
  last_sync_at: string | null
  sync_status: 'pending' | 'success' | 'failed' | null
  error_message: string | null
  created_at: string
  updated_at: string
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
  order_amount: number
  order_date: string | null
  created_at: string
}

interface CreateWheelData {
  storeId: string
  storeName: string
  logoUrl: string
  websiteUrl: string
  brandName: string
  allowedDomains?: string[]
  contactInfoType: 'email' | 'phone'
  widgetTitle: string
  widgetDescription: string
  buttonText: string
  backgroundColor: string
  buttonColor: string
  buttonTextColor: string
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

interface UpdateWheelData {
  wheelId: string
  storeName?: string
  logoUrl?: string
  websiteUrl?: string
  brandName?: string
  contactInfoType?: 'email' | 'phone'
  widgetTitle?: string
  widgetDescription?: string
  buttonText?: string
  backgroundColor?: string
  buttonColor?: string
  buttonTextColor?: string
  autoShow?: boolean
  showDelay?: number
  widgetPosition?: 'top-right' | 'top-left' | 'middle-right' | 'middle-left' | 'bottom-right' | 'bottom-left'
  active?: boolean
  prizes?: Array<{
    id?: string
    name: string
    description: string
    redirectUrl: string
    color: string
    chance: number
    couponCodes: string
  }>
}

interface UpdateWheelData {
  storeName?: string
  logoUrl?: string
  websiteUrl?: string
  brandName?: string
  contactInfoType?: 'email' | 'phone'
  widgetTitle?: string
  widgetDescription?: string
  buttonText?: string
  backgroundColor?: string
  buttonColor?: string
  buttonTextColor?: string
  autoShow?: boolean
  showDelay?: number
  widgetPosition?: 'top-right' | 'top-left' | 'middle-right' | 'middle-left' | 'bottom-right' | 'bottom-left'
  active?: boolean
  prizes?: Array<{
    id?: string
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
  totalRevenue: number
  dailyStats: DailyStats[]
  todaySpins: number
  weekSpins: number
  changeFromLastWeek: number
}

interface CarkContextType {
  wheels: Wheel[]
  wheelSpins: WheelSpinResult[]
  loading: boolean
  initialLoadDone: boolean
  analytics: AnalyticsStats | null
  wheelLimit: number
  currentWheelCount: number
  shopIntegration: ShopIntegration | null
  createWheel: (data: CreateWheelData) => Promise<{ success: boolean; error?: string; wheel?: Wheel }>
  updateWheel: (id: string, data: Partial<Wheel>) => Promise<void>
  fullUpdateWheel: (data: UpdateWheelData) => Promise<{ success: boolean; error?: string }>
  deleteWheel: (id: string) => Promise<void>
  refreshWheels: () => Promise<void>
  refreshWheelSpins: () => Promise<void>
  calculateAnalytics: () => void
  getWheelById: (id: string) => Wheel | undefined
  refreshShopIntegration: () => Promise<void>
  upsertShopIntegration: (platformType: string, username: string, password: string, storeName?: string) => Promise<{ success: boolean; error?: string }>
  syncOrdersFromIntegration: (startDate?: string, endDate?: string) => Promise<{ success: boolean; error?: string; data?: any }>
}

const CarkContext = createContext<CarkContextType | undefined>(undefined)

// Global wheel limit - maximum number of wheels a user can create
export const MAX_WHEELS = 5

export function CarkProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser()
  const [wheels, setWheels] = useState<Wheel[]>([])
  const [wheelSpins, setWheelSpins] = useState<WheelSpinResult[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null)
  const [shopIntegration, setShopIntegration] = useState<ShopIntegration | null>(null)

  // Get user ID for Supabase queries
  const userId = user?.id

  // Fetch all wheels (shops) - SECURITY: Only user's own shops
  const refreshWheels = async () => {
    setLoading(true)
    try {
      // Wait for auth to load
      if (!isUserLoaded) {
        setLoading(false)
        return
      }

      if (!userId) {
        console.warn('Kullanıcı giriş yapmamış, çarklar yüklenemiyor')
        setWheels([])
        return
      }

      // Use RPC function to get user's shops (works with TEXT type)
      const { data, error } = await supabase
        .rpc('get_user_shops', { p_customer_id: userId })

      if (error) throw error

      // Parse JSONB results
      const wheels = (data || []).map((item: any) => {
        const wheel = typeof item === 'string' ? JSON.parse(item) : item
        return wheel
      })

      // Generate embed codes and fetch prizes for each wheel
      const wheelsWithEmbed = await Promise.all(
        wheels.map(async (wheel: any) => {
          const domain = window.location.origin

          // API Key'i shops tablosundan al (RPC fonksiyonu döndürmüyor)
          const { data: shopData } = await supabase
            .from('shops')
            .select('api_key')
            .eq('id', wheel.id)
            .single()

          const apiKey = shopData?.api_key || ''

          // API Key Pattern: Kalıcı API key kullan, token üretme
          const widgetPosition = wheel.widget_settings?.widget_position || 'middle-right'
          const embedCode = generateWidgetEmbedCode(wheel.shop_id, apiKey, domain, widgetPosition)

          // Fetch prizes for this wheel
          const { data: prizesData } = await supabase
            .from('prizes')
            .select('*')
            .eq('shop_id', wheel.id)
            .order('display_order', { ascending: true })

          return {
            ...wheel,
            api_key: apiKey,
            embed_code: embedCode,
            widget_settings: wheel.widget_settings,
            prizes: prizesData || []
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
      // SECURITY: Check if user is authenticated
      if (!userId) {
        return { success: false, error: 'Oturum açmanız gerekiyor' }
      }

      // Check wheel limit
      if (wheels.length >= MAX_WHEELS) {
        return {
          success: false,
          error: `Maksimum ${MAX_WHEELS} adet çark oluşturabilirsiniz. Daha fazla çark için bizimle iletişime geçin.`
        }
      }

      // 1. Create shop with customer_id (user ID)
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          shop_id: data.storeId,
          customer_id: userId, // SECURITY: Link to user
          name: data.storeName,
          logo_url: data.logoUrl,
          website_url: data.websiteUrl,
          brand_name: data.brandName,
          contact_info_type: data.contactInfoType,
          active: true,
          allowed_domains: data.allowedDomains ? JSON.stringify(data.allowedDomains) : null
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
          button_text_color: data.buttonTextColor,
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

      // 4. Generate embed code - API Key Pattern
      // Yeni oluşturulan shop'un api_key'i shop objesinde var
      const widgetPosition = 'middle-right' // default position for new wheels
      const embedCode = generateWidgetEmbedCode(data.storeId, shop.api_key, window.location.origin, widgetPosition)

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
      if (!userId) {
        throw new Error('Oturum açmanız gerekiyor')
      }

      // First, fetch the shop to check ownership
      const { data: shop } = await supabase
        .from('shops')
        .select('id, customer_id')
        .eq('id', id)
        .single()

      if (!shop || shop.customer_id !== userId) {
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

  // Get wheel by ID - SECURITY: Only user's own shops
  const getWheelById = (id: string): Wheel | undefined => {
    return wheels.find(w => w.id === id)
  }

  // Full update wheel with all data (shop, widget settings, prizes)
  const fullUpdateWheel = async (data: UpdateWheelData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    try {
      if (!userId) {
        return { success: false, error: 'Oturum açmanız gerekiyor' }
      }

      const { wheelId, ...updateData } = data

      // First, fetch the shop to check ownership
      const { data: shop } = await supabase
        .from('shops')
        .select('id, customer_id')
        .eq('id', wheelId)
        .single()

      if (!shop || shop.customer_id !== userId) {
        return { success: false, error: 'Bu çarkı güncelleme yetkiniz yok' }
      }

      // 1. Update shop data
      if (updateData.storeName !== undefined || updateData.logoUrl !== undefined ||
        updateData.websiteUrl !== undefined || updateData.brandName !== undefined ||
        updateData.contactInfoType !== undefined || updateData.active !== undefined) {
        const { error: shopError } = await supabase
          .from('shops')
          .update({
            name: updateData.storeName,
            logo_url: updateData.logoUrl,
            website_url: updateData.websiteUrl,
            brand_name: updateData.brandName,
            contact_info_type: updateData.contactInfoType,
            active: updateData.active
          })
          .eq('id', wheelId)

        if (shopError) throw shopError
      }

      // 2. Update widget settings
      if (updateData.widgetTitle !== undefined || updateData.widgetDescription !== undefined ||
        updateData.buttonText !== undefined || updateData.backgroundColor !== undefined ||
        updateData.buttonColor !== undefined || updateData.autoShow !== undefined ||
        updateData.showDelay !== undefined || updateData.widgetPosition !== undefined ||
        updateData.buttonTextColor !== undefined) {
        const { error: widgetError } = await supabase
          .from('widget_settings')
          .update({
            title: updateData.widgetTitle,
            description: updateData.widgetDescription,
            button_text: updateData.buttonText,
            background_color: updateData.backgroundColor,
            button_color: updateData.buttonColor,
            button_text_color: updateData.buttonTextColor,
            show_on_load: updateData.autoShow,
            popup_delay: updateData.showDelay,
            widget_position: updateData.widgetPosition
          })
          .eq('shop_id', wheelId)

        if (widgetError) throw widgetError
      }

      // 3. Update prizes (delete old, insert new)
      if (updateData.prizes !== undefined) {
        // Delete existing prizes
        const { error: deletePrizesError } = await supabase
          .from('prizes')
          .delete()
          .eq('shop_id', wheelId)

        if (deletePrizesError) throw deletePrizesError

        // Insert new prizes
        if (updateData.prizes.length > 0) {
          const prizes = updateData.prizes.map((prize, index) => ({
            shop_id: wheelId,
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
        }
      }

      // 4. Refresh list
      await refreshWheels()

      return { success: true }
    } catch (err: any) {
      console.error('Error updating wheel:', err)
      return { success: false, error: err.message || 'Failed to update wheel' }
    } finally {
      setLoading(false)
    }
  }

  // Delete wheel - SECURITY: Only user's own shops
  const deleteWheel = async (id: string) => {
    setLoading(true)
    try {
      if (!userId) {
        throw new Error('Oturum açmanız gerekiyor')
      }

      // First, fetch the shop to check ownership
      const { data: shop } = await supabase
        .from('shops')
        .select('id, customer_id')
        .eq('id', id)
        .single()

      if (!shop || shop.customer_id !== userId) {
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
      // Wait for auth to load
      if (!isUserLoaded || !userId) {
        console.warn('Kullanıcı giriş yapmamış')
        setWheelSpins([])
        return
      }

      // First get user's shops
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('customer_id', userId)

      if (!shops || shops.length === 0) {
        setWheelSpins([])
        return
      }

      const shopIds = shops.map(s => s.id)

      // Pagination ile tüm kayıtları çek (Supabase 1000 limit var)
      const pageSize = 1000
      let allData: any[] = []
      let page = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('wheel_spins')
          .select('id, shop_id, full_name, email, phone, prize_type, coupon_code, order_amount, order_date, created_at')
          .in('shop_id', shopIds)
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error('Error fetching wheel_spins:', error.message, error)
          throw error
        }

        if (data && data.length > 0) {
          allData = allData.concat(data)
          console.log(`📊 Page ${page}: Fetched ${data.length} records, total: ${allData.length}`)
          page++

          // Eğer sayfa boyutundan az geldiyse, son sayfadayız demektir
          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      // Transform to match our interface
      const transformedData: WheelSpinResult[] = allData.map((spin: any) => ({
        id: spin.id,
        shop_id: spin.shop_id,
        full_name: spin.full_name,
        email: spin.email,
        phone: spin.phone,
        prize_name: spin.prize_type || 'Bilinmeyen Ödül',
        coupon_code: spin.coupon_code,
        order_amount: spin.order_amount || 0,
        order_date: spin.order_date || null,
        created_at: spin.created_at
      }))

      console.log(`✅ Total fetched: ${transformedData.length} wheel spins`)
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
        totalRevenue: 0,
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

    // Calculate total revenue (sum of all order amounts)
    const totalRevenue = wheelSpins.reduce((sum, spin) => sum + (spin.order_amount || 0), 0)

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

    // Calculate today's spins - Türkiye saati (UTC+3) ile
    const getTurkeyDateString = (date: Date) => {
      // Türkiye saati UTC+3, ISO string'inden 3 saat ekle
      const utcDate = new Date(date)
      const turkeyDate = new Date(utcDate.getTime() + 3 * 60 * 60 * 1000)
      return turkeyDate.toISOString().split('T')[0]
    }

    const localToday = getTurkeyDateString(new Date())

    const todaySpins = wheelSpins.filter(s => {
      const spinDateInTurkey = getTurkeyDateString(new Date(s.created_at))
      return spinDateInTurkey === localToday
    }).length

    console.log(`📅 Today (${localToday}): ${todaySpins} spins`)

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
      totalRevenue,
      dailyStats,
      todaySpins,
      weekSpins,
      changeFromLastWeek
    })

    // İlk yükleme tamamlandı
    setInitialLoadDone(true)
  }, [wheelSpins])

  // Fetch shop integration status
  const refreshShopIntegration = async () => {
    try {
      if (!isUserLoaded || !userId) {
        setShopIntegration(null)
        return
      }

      // İlk wheel'ın shop_id'sini kullan (kullanıcının shops'larından biri)
      if (wheels.length === 0) {
        setShopIntegration(null)
        return
      }

      const firstShopId = wheels[0].id

      const { data, error } = await supabase
        .from('shop_integrations')
        .select('id, shop_id, platform_type, api_username, store_name, is_active, last_sync_at, sync_status, error_message, created_at, updated_at')
        .eq('shop_id', firstShopId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching shop integration:', error)
        setShopIntegration(null)
        return
      }

      setShopIntegration(data)
    } catch (err) {
      console.error('Error fetching shop integration:', err)
      setShopIntegration(null)
    }
  }

  // Upsert shop integration
  const upsertShopIntegration = async (
    platformType: string,
    username: string,
    password: string,
    storeName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!userId) {
        return { success: false, error: 'Oturum açmanız gerekiyor' }
      }

      if (wheels.length === 0) {
        return { success: false, error: 'Önce bir çark oluşturmalısınız' }
      }

      const firstShopId = wheels[0].id

      // RPC fonksiyonunu kullanarak entegrasyon oluştur/güncelle
      const { error } = await supabase
        .rpc('upsert_shop_integration', {
          p_shop_id: firstShopId,
          p_platform_type: platformType,
          p_api_username: username,
          p_api_password: password,
          p_store_name: storeName || null
        })

      if (error) throw error

      // Entegrasyonu yeniden yükle
      await refreshShopIntegration()

      return { success: true }
    } catch (err: any) {
      console.error('Error upserting shop integration:', err)
      return { success: false, error: err.message || 'Entegrasyon kaydedilemedi' }
    }
  }

  // Sync orders from ButikSistem integration
  const syncOrdersFromIntegration = async (
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      if (!userId) {
        return { success: false, error: 'Oturum açmanız gerekiyor' }
      }

      if (wheels.length === 0) {
        return { success: false, error: 'Önce bir çark oluşturmalısınız' }
      }

      const firstShopId = wheels[0].id

      // API endpoint'e istek at
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { success: false, error: 'Oturum token bulunamadı' }
      }

      const response = await fetch('/api/cark/sync-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          shopId: firstShopId,
          startDate,
          endDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || 'Senkronizasyon hatası' }
      }

      const result = await response.json()

      // Başarılı olursa wheel_spins ve analytics'i yenile
      await refreshWheelSpins()

      return { success: true, data: result.data }
    } catch (err: any) {
      console.error('Error syncing orders:', err)
      return { success: false, error: err.message || 'Senkronizasyon başarısız' }
    }
  }

  // Fetch on mount and when user auth state changes
  useEffect(() => {
    // Only fetch if auth is loaded and user is logged in
    if (isUserLoaded && userId) {
      refreshWheels()
      refreshWheelSpins()
    }
  }, [isUserLoaded, userId])

  // Fetch shop integration when wheels are loaded
  useEffect(() => {
    if (wheels.length > 0 && userId) {
      refreshShopIntegration()
    }
  }, [wheels, userId])

  // Calculate analytics when wheelSpins changes
  useEffect(() => {
    calculateAnalytics()
  }, [wheelSpins, calculateAnalytics])

  return (
    <CarkContext.Provider value={{
      wheels,
      wheelSpins,
      loading,
      initialLoadDone,
      analytics,
      wheelLimit: MAX_WHEELS,
      currentWheelCount: wheels.length,
      shopIntegration,
      createWheel,
      updateWheel,
      fullUpdateWheel,
      deleteWheel,
      refreshWheels,
      refreshWheelSpins,
      calculateAnalytics,
      getWheelById,
      refreshShopIntegration,
      upsertShopIntegration,
      syncOrdersFromIntegration
    }}>
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
export type { Wheel, Prize, CreateWheelData, UpdateWheelData, WheelSpinResult, DailyStats, AnalyticsStats }
