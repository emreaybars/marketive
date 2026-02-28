'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { generateWidgetToken } from '@/lib/widget-token'

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

interface CarkContextType {
  wheels: Wheel[]
  wheelSpins: WheelSpinResult[]
  loading: boolean
  createWheel: (data: CreateWheelData) => Promise<{ success: boolean; error?: string; wheel?: Wheel }>
  updateWheel: (id: string, data: Partial<Wheel>) => Promise<void>
  deleteWheel: (id: string) => Promise<void>
  refreshWheels: () => Promise<void>
  refreshWheelSpins: () => Promise<void>
}

const CarkContext = createContext<CarkContextType | undefined>(undefined)

export function CarkProvider({ children }: { children: ReactNode }) {
  const [wheels, setWheels] = useState<Wheel[]>([])
  const [wheelSpins, setWheelSpins] = useState<WheelSpinResult[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch all wheels (shops) - SECURITY: Only user's own shops
  const refreshWheels = async () => {
    setLoading(true)
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser?.id) {
        console.warn('Kullanıcı giriş yapmamış')
        setWheels([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          widget_settings (*)
        `)
        .eq('customer_id', currentUser.id) // SECURITY: Filter by current user
        .order('created_at', { ascending: false })

      if (error) throw error

      // Generate embed codes for each wheel
      const wheelsWithEmbed = await Promise.all(
        (data || []).map(async (wheel: any) => {
          const token = await generateWidgetToken(wheel.shop_id, wheel.id)
          const domain = window.location.origin
          const embedCode = `<!-- Çarkıfelek Widget -->
<script id="carkifelek-widget-script"
  data-shop-token="${token}"
  src="${domain}/widget.js">
</script>`
          return {
            ...wheel,
            embed_code: embedCode
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
      // Get current user - SECURITY: Associate shop with authenticated user
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser?.id) {
        return { success: false, error: 'Oturum açmanız gerekiyor' }
      }

      // 1. Create shop with customer_id
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          shop_id: data.storeId,
          customer_id: currentUser.id, // SECURITY: Link to current user
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
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser?.id) {
        throw new Error('Oturum açmanız gerekiyor')
      }

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
        .eq('customer_id', currentUser.id) // SECURITY: Only user's own shops

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
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser?.id) {
        throw new Error('Oturum açmanız gerekiyor')
      }

      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id)
        .eq('customer_id', currentUser.id) // SECURITY: Only user's own shops

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
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser?.id) {
        console.warn('Kullanıcı giriş yapmamış')
        setWheelSpins([])
        setLoading(false)
        return
      }

      // Get user's shop IDs first
      const { data: userShops } = await supabase
        .from('shops')
        .select('id')
        .eq('customer_id', currentUser.id)

      const shopIds = userShops?.map((s: any) => s.id) || []

      if (shopIds.length === 0) {
        setWheelSpins([])
        setLoading(false)
        return
      }

      // Query from won_prizes which has the correct prize_id relation
      const { data, error } = await supabase
        .from('won_prizes')
        .select(`
          id,
          shop_id,
          full_name,
          email,
          phone,
          coupon_code,
          won_at,
          prize:prizes(name)
        `)
        .in('shop_id', shopIds) // SECURITY: Only user's shops
        .order('won_at', { ascending: false })

      if (error) throw error

      // Transform data to match our interface
      const transformedData: WheelSpinResult[] = (data || []).map((item: any) => ({
        id: item.id,
        shop_id: item.shop_id,
        full_name: item.full_name,
        email: item.email,
        phone: item.phone,
        prize_name: item.prize?.name || 'Bilinmeyen Ödül',
        coupon_code: item.coupon_code,
        created_at: item.won_at
      }))

      setWheelSpins(transformedData)
    } catch (err) {
      console.error('Error fetching wheel spins:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    refreshWheels()
    refreshWheelSpins()
  }, [])

  return (
    <CarkContext.Provider value={{ wheels, wheelSpins, loading, createWheel, updateWheel, deleteWheel, refreshWheels, refreshWheelSpins }}>
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
export type { Wheel, Prize, CreateWheelData, WheelSpinResult }
