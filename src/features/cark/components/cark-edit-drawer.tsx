'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { X, Plus, Store, Settings, Gift, Copy, Wand2, Upload, ArrowRight, Eye, Save, Edit } from 'lucide-react'
import { useCark } from './cark-provider'
import type { Wheel } from './cark-provider'
import { WheelPreview } from './wheel-preview'

// Ödül tipi
interface PrizeFormData {
  id: string
  name: string
  chance: number
  description: string
  color: string
  redirectUrl: string
  couponCodes: string
  couponCount: number
}

// İletişim bilgisi tipi
type ContactInfoType = 'email' | 'phone'

// Form veri tipi
interface WheelFormData {
  storeName: string
  logoUrl: string
  websiteUrl: string
  brandName: string
  contactInfoType: ContactInfoType
  widgetTitle: string
  widgetDescription: string
  buttonText: string
  backgroundColor: string
  buttonColor: string
  buttonTextColor: string
  autoShow: boolean
  showDelay: number
  active: boolean
  prizes: PrizeFormData[]
}

const defaultPrize: PrizeFormData = {
  id: '1',
  name: '',
  chance: 33,
  description: '',
  color: '#fa3939',
  redirectUrl: '',
  couponCodes: '',
  couponCount: 5
}

// Kupon kodu oluşturma fonksiyonu
function generateCouponCodes(count: number): string[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    let code = ''
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    codes.push(code)
  }

  return codes
}

// Renk Seçici Bileşeni
function ColorPickerInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-8 sm:h-9 font-mono text-sm"
      />
      <div className="relative h-8 sm:h-9 w-10 sm:w-12 cursor-pointer border-2 rounded-md hover:scale-105 transition-all"
           style={{ borderColor: value }}>
        <input
          type="color"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-full h-full rounded" style={{ backgroundColor: value }} />
      </div>
    </div>
  )
}

interface CarkEditDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wheel: Wheel | null
}

export function CarkEditDrawer({ open, onOpenChange, wheel }: CarkEditDrawerProps) {
  const [activeTab, setActiveTab] = useState<'store' | 'widget' | 'prizes'>('store')
  const { fullUpdateWheel } = useCark()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<WheelFormData>({
    storeName: '',
    logoUrl: '',
    websiteUrl: '',
    brandName: '',
    contactInfoType: 'email',
    widgetTitle: 'Çarkı Çevir Hediyeni Kazan!',
    widgetDescription: 'Hediyeni almak için hemen çarkı çevir.',
    buttonText: 'ÇARKI ÇEVİR',
    backgroundColor: 'rgba(139, 0, 0, 0.7)',
    buttonColor: '#d10000',
    buttonTextColor: '#ffffff',
    autoShow: false,
    showDelay: 2000,
    active: true,
    prizes: []
  })

  // Load wheel data when drawer opens
  useEffect(() => {
    if (open && wheel) {
      setFormData({
        storeName: wheel.name || '',
        logoUrl: wheel.logo_url || '',
        websiteUrl: wheel.website_url || '',
        brandName: wheel.brand_name || '',
        contactInfoType: wheel.contact_info_type || 'email',
        widgetTitle: wheel.widget_settings?.title || 'Çarkı Çevir Hediyeni Kazan!',
        widgetDescription: wheel.widget_settings?.description || 'Hediyeni almak için hemen çarkı çevir.',
        buttonText: wheel.widget_settings?.button_text || 'ÇARKI ÇEVİR',
        backgroundColor: wheel.widget_settings?.background_color || 'rgba(139, 0, 0, 0.7)',
        buttonColor: wheel.widget_settings?.button_color || '#d10000',
        buttonTextColor: '#ffffff',
        autoShow: wheel.widget_settings?.show_on_load || false,
        showDelay: wheel.widget_settings?.popup_delay || 2000,
        active: wheel.active ?? true,
        prizes: wheel.prizes?.map(p => ({
          id: p.id,
          name: p.name,
          chance: p.chance,
          description: p.description || '',
          color: p.color,
          redirectUrl: p.redirect_url || '',
          couponCodes: p.coupon_codes || '',
          couponCount: 5
        })) || []
      })
      setLogoPreview(wheel.logo_url || null)
      setActiveTab('store')
    }
  }, [open, wheel])

  const handleSave = async () => {
    if (!wheel) return

    // Validasyon
    if (!formData.storeName.trim()) {
      alert('Lütfen mağaza adı girin')
      return
    }
    if (formData.prizes.length < 3) {
      alert('En az 3 ödül eklemelisiniz')
      return
    }
    if (totalChance !== 100) {
      alert('Toplam şans %100 olmalıdır')
      return
    }

    setIsSaving(true)

    const result = await fullUpdateWheel({
      wheelId: wheel.id,
      storeName: formData.storeName.trim(),
      logoUrl: formData.logoUrl,
      websiteUrl: formData.websiteUrl,
      brandName: formData.brandName,
      contactInfoType: formData.contactInfoType,
      widgetTitle: formData.widgetTitle,
      widgetDescription: formData.widgetDescription,
      buttonText: formData.buttonText,
      backgroundColor: formData.backgroundColor,
      buttonColor: formData.buttonColor,
      autoShow: formData.autoShow,
      showDelay: formData.showDelay,
      active: formData.active,
      prizes: formData.prizes.map(p => ({
        name: p.name,
        description: p.description,
        redirectUrl: p.redirectUrl,
        color: p.color,
        chance: p.chance,
        couponCodes: p.couponCodes
      }))
    })

    setIsSaving(false)

    if (result.success) {
      onOpenChange(false)
    } else {
      alert('Hata: ' + (result.error || 'Çark güncellenemedi'))
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
        setFormData({ ...formData, logoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoRemove = () => {
    setLogoPreview(null)
    setFormData({ ...formData, logoUrl: '' })
  }

  const handleNext = () => {
    if (activeTab === 'store') setActiveTab('widget')
    else if (activeTab === 'widget') setActiveTab('prizes')
  }

  const addPrize = () => {
    if (formData.prizes.length >= 12) return
    const newPrize: PrizeFormData = {
      ...defaultPrize,
      id: Date.now().toString(),
      chance: Math.floor(100 / (formData.prizes.length + 1))
    }
    setFormData({ ...formData, prizes: [...formData.prizes, newPrize] })
  }

  const updatePrize = (id: string, field: keyof PrizeFormData, value: string | number) => {
    setFormData({
      ...formData,
      prizes: formData.prizes.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    })
  }

  const removePrize = (id: string) => {
    if (formData.prizes.length <= 3) return
    setFormData({ ...formData, prizes: formData.prizes.filter((p) => p.id !== id) })
  }

  const duplicatePrize = (id: string) => {
    if (formData.prizes.length >= 12) return
    const prizeToDuplicate = formData.prizes.find((p) => p.id === id)
    if (!prizeToDuplicate) return

    const duplicatedPrize: PrizeFormData = {
      ...prizeToDuplicate,
      id: Date.now().toString(),
      name: `${prizeToDuplicate.name} (Kopya)`,
    }
    setFormData({ ...formData, prizes: [...formData.prizes, duplicatedPrize] })
  }

  const isFormValid = formData.storeName.trim().length > 0 && formData.prizes.length >= 3

  // Toplam şansı hesapla
  const totalChance = formData.prizes.reduce((sum, p) => sum + p.chance, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[550px] lg:w-[600px] p-0 gap-0 flex flex-col h-full">
          {/* Header */}
          <div className="relative flex items-center justify-between px-6 py-5 sm:px-8 sm:py-6 border-b bg-muted/30 shrink-0 overflow-hidden">
            {/* Gradient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl rounded-full pointer-events-none" />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/10">
                <Edit className="h-6 w-6 sm:h-7 sm:w-7 text-primary drop-shadow-sm" />
              </div>
              <div>
                <SheetTitle className="text-lg sm:text-xl font-semibold">Çarkı Düzenle</SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">
                  {wheel?.name || 'Çark'} ayarlarını güncelleyin
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full mb-5 sm:mb-7 h-11 p-1 bg-muted/50 grid-cols-3">
                <TabsTrigger value="store" className="text-sm">
                  <Store className="h-3.5 w-3.5 mr-1" />
                  Mağaza
                </TabsTrigger>
                <TabsTrigger value="widget" className="text-sm">
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  Widget
                </TabsTrigger>
                <TabsTrigger value="prizes" className="text-sm">
                  <Gift className="h-3.5 w-3.5 mr-1" />
                  Ödüller
                </TabsTrigger>
              </TabsList>

              {/* Mağaza Bilgileri */}
              <TabsContent value="store" className="space-y-5 sm:space-y-7 mt-3">
                <div className="space-y-4 sm:space-y-5">
                  {/* Mağaza Adı */}
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-sm font-medium">
                      Mağaza Adı <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="storeName"
                      placeholder="örn: Mağaza Adı"
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="logoUpload" className="text-sm font-medium">Logo</Label>

                    {logoPreview ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="h-12 w-12 rounded-md bg-background flex items-center justify-center overflow-hidden border">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">Logo yüklendi</p>
                          <p className="text-xs text-muted-foreground">Görsel önizlemesi</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleLogoRemove}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          id="logoUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 p-4 sm:p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Logo yükleyin</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG veya GIF (max 2MB)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Website URL */}
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl" className="text-sm font-medium">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      placeholder="https://www.example.com"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>

                  {/* Marka Adı */}
                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-sm font-medium">Marka Adı</Label>
                    <Input
                      id="brandName"
                      placeholder="Marka adı girin..."
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>
                </div>

                <Separator />

                {/* İletişim Bilgisi Toplama */}
                <div className="space-y-4 sm:space-y-5">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                    İletişim Bilgisi Toplama
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Müşteriden hangi iletişim bilgisini istemek istersiniz?
                    </Label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input
                          type="radio"
                          name="contactInfoType"
                          value="email"
                          checked={formData.contactInfoType === 'email'}
                          onChange={(e) => setFormData({ ...formData, contactInfoType: e.target.value as ContactInfoType })}
                          className="h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">E-posta</div>
                          <div className="text-xs text-muted-foreground">Müşteriden sadece e-posta adresi istenir</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input
                          type="radio"
                          name="contactInfoType"
                          value="phone"
                          checked={formData.contactInfoType === 'phone'}
                          onChange={(e) => setFormData({ ...formData, contactInfoType: e.target.value as ContactInfoType })}
                          className="h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Telefon Numarası</div>
                          <div className="text-xs text-muted-foreground">Müşteriden sadece telefon numarası istenir</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  {/* Aktif/Pasif Durum */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Çark Durumu</Label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="h-4 w-4 text-primary"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{formData.active ? 'Aktif' : 'Pasif'}</div>
                        <div className="text-xs text-muted-foreground">
                          {formData.active ? 'Çark kullanıma açık' : 'Çark kullanıma kapalı'}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </TabsContent>

              {/* Widget Ayarları */}
              <TabsContent value="widget" className="space-y-5 sm:space-y-7 mt-3">
                <div className="space-y-4 sm:space-y-5">

                  {/* Başlık */}
                  <div className="space-y-2">
                    <Label htmlFor="widgetTitle" className="text-sm font-medium">Başlık</Label>
                    <Input
                      id="widgetTitle"
                      placeholder="Çarkı Çevir Hediyeni Kazan!"
                      value={formData.widgetTitle}
                      onChange={(e) => setFormData({ ...formData, widgetTitle: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>

                  {/* Açıklama */}
                  <div className="space-y-2">
                    <Label htmlFor="widgetDescription" className="text-sm font-medium">Açıklama</Label>
                    <Textarea
                      id="widgetDescription"
                      placeholder="Hediyeni almak için hemen çarkı çevir."
                      value={formData.widgetDescription}
                      onChange={(e) => setFormData({ ...formData, widgetDescription: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* Buton Metni */}
                  <div className="space-y-2">
                    <Label htmlFor="buttonText" className="text-sm font-medium">Buton Metni</Label>
                    <Input
                      id="buttonText"
                      placeholder="ÇARKI ÇEVİR"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>

                  {/* Renk Seçimleri */}
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    {/* Arka Plan Rengi */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Arka Plan Rengi</Label>
                      <ColorPickerInput
                        value={formData.backgroundColor}
                        onChange={(value) => setFormData({ ...formData, backgroundColor: value })}
                        placeholder="rgba(139, 0, 0, 0.7)"
                      />
                    </div>

                    {/* Buton Rengi */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Buton Rengi</Label>
                      <ColorPickerInput
                        value={formData.buttonColor}
                        onChange={(value) => setFormData({ ...formData, buttonColor: value })}
                        placeholder="#d10000"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Ödüller */}
              <TabsContent value="prizes" className="space-y-4 sm:space-y-5 mt-3">
                {/* Canlı Önizleme */}
                {formData.prizes.length >= 3 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Canlı Önizleme</span>
                      {totalChance !== 100 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          (Toplam şans %100 olmalı)
                        </span>
                      )}
                    </div>
                    <div
                      className="relative overflow-hidden rounded-2xl p-6 flex flex-col items-center"
                      style={{ background: formData.backgroundColor || 'rgba(139, 0, 0, 0.9)' }}
                    >
                      {/* Logo */}
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="h-10 max-w-[100px] object-contain mb-3"
                        />
                      )}

                      {/* Başlık */}
                      <div className="text-center mb-3 w-full">
                        <p className="text-white text-lg font-bold uppercase tracking-wide leading-tight mb-1">
                          {formData.widgetTitle}
                        </p>
                        <p className="text-white/80 text-xs">
                          {formData.widgetDescription}
                        </p>
                      </div>

                      {/* Spin Button */}
                      <button
                        className="relative overflow-hidden w-full max-w-[220px] py-2.5 px-4 rounded-[22px] font-semibold text-white text-xs mb-4"
                        style={{
                          backgroundColor: formData.buttonColor,
                          color: formData.buttonTextColor,
                          boxShadow: '1px 5px 0px rgba(0, 0, 0, 0.22)'
                        }}
                      >
                        <span className="relative">{formData.buttonText}</span>
                      </button>

                      {/* Wheel Preview */}
                      <WheelPreview
                        prizes={formData.prizes.map(p => ({
                          id: p.id,
                          name: p.name || 'Ödül',
                          color: p.color,
                          chance: p.chance
                        }))}
                        size={200}
                        showOuterRing={true}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Ödüller
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En az 3, en fazla 12 ödül ekleyebilirsiniz. Çarkta eşit aralıklarla gösterilecektir.
                  </p>
                </div>

                <Separator />

                {/* Ödül listesi */}
                {formData.prizes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-6">
                      <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                        <Gift className="h-12 w-12 sm:h-14 sm:w-14 text-primary drop-shadow-sm" />
                      </div>
                    </div>
                    <Button onClick={addPrize} className="gap-2 shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" />
                      İlk Ödülü Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.prizes.map((prize, index) => (
                      <div
                        key={prize.id}
                        className="rounded-xl border bg-card overflow-hidden"
                      >
                        {/* Prize Header */}
                        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-muted/30 border-b">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-primary/10 text-primary font-semibold text-xs">
                              {index + 1}
                            </div>
                            <span className="text-xs sm:text-sm font-medium">Ödül #{index + 1}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicatePrize(prize.id)}
                              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary"
                              title="Ödülü kopyala"
                            >
                              <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                            {formData.prizes.length > 3 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePrize(prize.id)}
                                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                                title="Ödülü sil"
                              >
                                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Prize Body */}
                        <div className="p-4 space-y-3">
                          {/* Üst Satır: Ödül Adı ve Şans */}
                          <div className="grid grid-cols-[2fr_1fr_auto] gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor={`prize-name-${prize.id}`} className="text-xs font-medium">
                                Ödül Adı
                              </Label>
                              <Input
                                id={`prize-name-${prize.id}`}
                                placeholder="100TL İndirim"
                                value={prize.name}
                                onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                                className="h-9 text-sm"
                                maxLength={20}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`prize-chance-${prize.id}`} className="text-xs font-medium">
                                Şans
                              </Label>
                              <Input
                                id={`prize-chance-${prize.id}`}
                                type="number"
                                min={0}
                                max={100}
                                value={prize.chance}
                                onChange={(e) => updatePrize(prize.id, 'chance', parseInt(e.target.value) || 0)}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Renk</Label>
                              <div className="relative h-9 w-12 cursor-pointer border-2 rounded-md hover:scale-105 transition-all"
                                   style={{ borderColor: prize.color }}>
                                <input
                                  type="color"
                                  value={prize.color}
                                  onChange={(e) => updatePrize(prize.id, 'color', e.target.value)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-md"
                                />
                                <div className="w-full h-full rounded-md" style={{ backgroundColor: prize.color }} />
                              </div>
                            </div>
                          </div>

                          {/* Açıklama */}
                          <div className="space-y-1.5">
                            <Label htmlFor={`prize-desc-${prize.id}`} className="text-xs font-medium">
                              Açıklama
                            </Label>
                            <Textarea
                              id={`prize-desc-${prize.id}`}
                              placeholder="Kazanan kullanıcılar için mesaj"
                              value={prize.description}
                              onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>

                          {/* URL ve Kupon */}
                          <div className="grid grid-cols-[2fr_1fr] gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor={`prize-url-${prize.id}`} className="text-xs font-medium">
                                Yönlendirme URL
                              </Label>
                              <Input
                                id={`prize-url-${prize.id}`}
                                placeholder="https://site.com/page"
                                value={prize.redirectUrl}
                                onChange={(e) => updatePrize(prize.id, 'redirectUrl', e.target.value)}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Kuponlar</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const codes = generateCouponCodes(prize.couponCount || 1)
                                  updatePrize(prize.id, 'couponCodes', codes.join('\n'))
                                }}
                                className="h-9 w-full text-xs gap-1"
                              >
                                <Wand2 className="h-3 w-3" />
                                Kod Oluştur
                              </Button>
                            </div>
                          </div>

                          {/* Kupon Kodları Textarea */}
                          <div className="space-y-1.5">
                            <Textarea
                              placeholder="Kupon kodları (her satır bir kod)"
                              value={prize.couponCodes}
                              onChange={(e) => updatePrize(prize.id, 'couponCodes', e.target.value)}
                              rows={2}
                              className="resize-none text-sm font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Ödül Ekle Butonu */}
                    {formData.prizes.length < 12 && (
                      <Button
                        onClick={addPrize}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Ödül Ekle
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <SheetFooter className="border-t bg-muted/30 px-6 py-4 sm:px-8 sm:py-5 shrink-0">
            <div className="flex items-center gap-3 flex-1">
              {/* Adım Göstergesi */}
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full transition-colors ${activeTab === 'store' ? 'bg-primary' : 'bg-primary/40'}`} />
                <div className={`h-2 w-2 rounded-full transition-colors ${activeTab === 'widget' ? 'bg-primary' : activeTab === 'prizes' ? 'bg-primary/40' : 'bg-muted'}`} />
                <div className={`h-2 w-2 rounded-full transition-colors ${activeTab === 'prizes' ? 'bg-primary' : 'bg-muted'}`} />
              </div>
              <span className="text-xs text-muted-foreground">
                {activeTab === 'store' && '1 / 3 • Mağaza bilgileri'}
                {activeTab === 'widget' && '2 / 3 • Widget ayarları'}
                {activeTab === 'prizes' && `3 / 3 • ${formData.prizes.length} ödül`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'prizes' ? (
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid || totalChance !== 100 || isSaving}
                  className="w-full sm:min-w-[120px] shadow-lg shadow-primary/20"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-full shadow-sm">
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
  )
}
