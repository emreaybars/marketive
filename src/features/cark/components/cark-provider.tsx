'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { generateWidgetToken } from '@/lib/widget-token'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qiiygcclanmgzlrcpmle.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
  loading: boolean
  createWheel: (data: CreateWheelData) => Promise<{ success: boolean; error?: string; wheel?: Wheel }>
  updateWheel: (id: string, data: Partial<Wheel>) => Promise<void>
  deleteWheel: (id: string) => Promise<void>
  refreshWheels: () => Promise<void>
}

const CarkContext = createContext<CarkContextType | undefined>(undefined)

export function CarkProvider({ children }: { children: ReactNode }) {
  const [wheels, setWheels] = useState<Wheel[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch all wheels (shops)
  const refreshWheels = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          widget_settings (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWheels(data || [])
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
      // 1. Create shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          shop_id: data.storeId,
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

      // 4. Generate embed code
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin
      const token = await generateWidgetToken(data.storeId, shop.id)
      const embedCode = `<!-- Çarkıfelek Widget -->
<script id="carkifelek-widget-script"
  data-shop-token="${token}"
  src="${apiBaseUrl}/widget.js">
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

  // Update wheel
  const updateWheel = async (id: string, data: Partial<Wheel>) => {
    setLoading(true)
    try {
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

  // Delete wheel
  const deleteWheel = async (id: string) => {
    setLoading(true)
    try {
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

  // Fetch on mount
  useState(() => {
    refreshWheels()
  })

  return (
    <CarkContext.Provider value={{ wheels, loading, createWheel, updateWheel, deleteWheel, refreshWheels }}>
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

// Helper: Generate shop token (client-side)
// NOTE: In production, this should be server-side for security
async function generateShopToken(shopUuid: string, shopId: string): Promise<string> {
  // For now, generate client-side using crypto API
  const WIDGET_SECRET = process.env.NEXT_PUBLIC_WIDGET_SECRET || 'default-secret-change-in-production'

  const payload = {
    sid: shopId,
    uid: shopUuid,
    ts: Date.now()
  }

  const payloadStr = JSON.stringify(payload)
  const signature = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(payloadStr + WIDGET_SECRET)
  )
  const signatureArray = Array.from(new Uint8Array(signature))
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const signedPayload = { ...payload, sig: signatureHex }
  return Buffer.from(JSON.stringify(signedPayload)).toString('base64url')
}
