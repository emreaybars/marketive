'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { X, Plus, Sparkles, Store, Settings, Gift, Copy, Wand2, Upload } from 'lucide-react'
import { useCark } from './cark-provider'
import { WheelOfFortune, type WheelOfFortuneRef } from '@matmachry/react-wheel-of-fortune'

// Ödül tipi
interface Prize {
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
  // Mağaza Bilgileri
  storeId: string
  storeName: string
  logoUrl: string
  websiteUrl: string
  brandName: string

  // İletişim Bilgisi
  contactInfoType: ContactInfoType

  // Widget Ayarları
  widgetTitle: string
  widgetDescription: string
  buttonText: string
  backgroundColor: string
  buttonColor: string
  buttonTextColor: string
  autoShow: boolean
  showDelay: number

  // Ödüller
  prizes: Prize[]
}

const defaultPrize: Prize = {
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
    // 8 karakterlik rastgele kod
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

// Custom Spin Button component
type SpinButtonProps = React.ComponentProps<"button">
function SpinButton({ onClick, disabled }: SpinButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-lg transform transition-all duration-200 hover:scale-110 active:scale-95 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-300 to-green-400 animate-pulse opacity-60"></div>
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 border-3 border-white shadow-inner flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-bold text-sm sm:text-base tracking-wider drop-shadow-lg">ÇEVİR</div>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-200 opacity-50 group-hover:animate-spin"></div>
      </div>
    </button>
  )
}

// Custom Pointer component
function PointerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" fillRule="evenodd" d="M20.05 17.65a3 3 0 0 0 1.2-2.4v-11a3 3 0 0 0-3-3h-12a3 3 0 0 0-3 3v11a3 3 0 0 0 1.2 2.4l6 4.5a3 3 0 0 0 3.6 0z" clipRule="evenodd" />
    </svg>
  )
}

const initialFormData: WheelFormData = {
  // Mağaza Bilgileri
  storeId: '',
  storeName: '',
  logoUrl: '',
  websiteUrl: '',
  brandName: '',

  // İletişim Bilgisi
  contactInfoType: 'email',

  // Widget Ayarları
  widgetTitle: 'Çarkı Çevir Hediyeni Kazan!',
  widgetDescription: 'Hediyeni almak için hemen çarkı çevir.',
  buttonText: 'ÇARKI ÇEVİR',
  backgroundColor: 'rgba(139, 0, 0, 0.7)',
  buttonColor: '#d10000',
  buttonTextColor: '#ffffff',
  autoShow: false,
  showDelay: 2000,

  // Ödüller
  prizes: []
}

export function CarkCreateDrawer() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'store' | 'widget' | 'prizes' | 'success'>('store')
  const { createWheel } = useCark()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [embedCode, setEmbedCode] = useState<string>('')
  const wheelRef = useRef<WheelOfFortuneRef>(null)
  const [winnerKey, setWinnerKey] = useState<string>('')
  const [isSpinning, setIsSpinning] = useState(false)

  const [formData, setFormData] = useState<WheelFormData>(initialFormData)

  const handleSubmit = async () => {
    // Validasyon
    if (!formData.storeId.trim()) {
      alert('Lütfen Mağaza ID girin')
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

    // Supabase'e kaydet
    const result = await createWheel({
      storeId: formData.storeId.trim(),
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
      prizes: formData.prizes.map(p => ({
        name: p.name,
        description: p.description,
        redirectUrl: p.redirectUrl,
        color: p.color,
        chance: p.chance,
        couponCodes: p.couponCodes
      }))
    })

    if (result.success && result.wheel) {
      // Başarılı - embed kodu göster
      setEmbedCode(result.wheel.embed_code || '')
      setActiveTab('success')
    } else {
      alert('Hata: ' + (result.error || 'Çark oluşturulamadı'))
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
    const newPrize: Prize = {
      ...defaultPrize,
      id: Date.now().toString(),
      chance: Math.floor(100 / (formData.prizes.length + 1))
    }
    setFormData({ ...formData, prizes: [...formData.prizes, newPrize] })
  }

  const updatePrize = (id: string, field: keyof Prize, value: string | number) => {
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

    const duplicatedPrize: Prize = {
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
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            Çark Oluştur
          </Button>
        </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[550px] lg:w-[600px] p-0 gap-0 flex flex-col h-full">
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 sm:px-8 sm:py-6 border-b bg-muted/30 shrink-0 pr-16 overflow-hidden">
          {/* Gradient glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl rounded-full pointer-events-none" />

          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/10">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary drop-shadow-sm" />
            </div>
            <div>
              <SheetTitle className="text-lg sm:text-xl font-semibold">Yeni Çark Oluştur</SheetTitle>
              <SheetDescription className="text-xs sm:text-sm">
                Çarkınızı adım adım özelleştirin
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className={`grid w-full mb-5 sm:mb-7 h-11 p-1 bg-muted/50 ${embedCode ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
              {embedCode && (
                <TabsTrigger value="success" className="text-sm text-green-600">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Tamamlandı
                </TabsTrigger>
              )}
            </TabsList>

            {/* Mağaza Bilgileri */}
            <TabsContent value="store" className="space-y-5 sm:space-y-7 mt-3">
              <div className="space-y-4 sm:space-y-5">
                {/* Mağaza ID */}
                <div className="space-y-2">
                  <Label htmlFor="storeId" className="text-sm font-medium">
                    Mağaza ID<span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="storeId"
                    placeholder="örn: magaza-adi"
                    value={formData.storeId}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="h-9 sm:h-10"
                  />
                </div>

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
                  <p className="text-xs text-muted-foreground">
                    Önerilen: 150x60px, şeffaf PNG
                  </p>
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

                  {/* Buton Yazı Rengi */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Buton Yazı Rengi</Label>
                    <ColorPickerInput
                      value={formData.buttonTextColor}
                      onChange={(value) => setFormData({ ...formData, buttonTextColor: value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Ödüller */}
            <TabsContent value="prizes" className="mt-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol Taraf - Formlar */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Ödüller
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      En az 3, en fazla 12 ödül ekleyebilirsiniz. Toplam şans %100 olmalıdır.
                    </p>
                  </div>

                  <Separator />

                  {/* Boş durum */}
                  {formData.prizes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                  {/* Çark Görseli */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent blur-2xl rounded-full" />
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                      {/* Basit çark dilimleri */}
                      <div className="absolute inset-2 rounded-full border-4 border-dashed border-primary/30" />
                      <Gift className="h-12 w-12 sm:h-14 sm:w-14 text-primary drop-shadow-sm" />
                    </div>
                  </div>

                  {/* Metinler */}
                  <div className="space-y-2 mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold">Ödül Ekleyin</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-xs mx-auto leading-relaxed">
                      Çarkınız için en az <span className="font-medium text-foreground">3 ödül</span> eklemeniz gerekiyor.
                    </p>
                  </div>

                  {/* Ödül Tipleri Önizleme */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">İndirim</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Kupon</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Hediye</span>
                    </div>
                  </div>

                  {/* Buton */}
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
                </div>

                {/* Sağ Taraf - Canlı Çark Önizleme */}
                {formData.prizes.length >= 3 && (
                  <div className="flex flex-col items-center">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-4">
                      Canlı Önizleme
                    </div>

                    {/* Wheel Preview */}
                    <div className="relative flex items-center justify-center p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl border">
                      <WheelOfFortune
                        ref={wheelRef}
                        prizes={formData.prizes.map((p) => ({
                          key: p.id,
                          color: p.color as `#${string}`,
                          prize: (
                            <div className="flex flex-col items-center gap-1">
                              <Gift className="size-6" />
                              <span className="font-bold text-xs leading-tight">{p.name || 'Ödül'}</span>
                            </div>
                          ),
                          probability: p.chance / 100
                        }))}
                        wheelPointer={
                          <PointerIcon
                            style={{ filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3))' }}
                            className="text-white size-10"
                          />
                        }
                        wheelSpinButton={
                          <SpinButton
                            onClick={() => {
                              setIsSpinning(true)
                              wheelRef.current?.spin()
                            }}
                            disabled={isSpinning}
                          />
                        }
                        onSpinStart={() => {
                          setWinnerKey('')
                        }}
                        onSpinEnd={(prize) => {
                          setWinnerKey(prize.key)
                          setIsSpinning(false)
                        }}
                        animationDurationInMs={4000}
                        useProbabilitiesToCalculateWinner={true}
                        className="max-w-full"
                      />
                    </div>

                    {/* Kazanan Sonuç */}
                    {winnerKey && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          🎉 Kazanan Ödül: {formData.prizes.find(p => p.id === winnerKey)?.name || 'Ödül'}
                        </p>
                      </div>
                    )}

                    {/* Toplam Şans Göstergesi */}
                    <div className="mt-4 text-xs text-muted-foreground">
                      Toplam Şans: <span className={totalChance === 100 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {totalChance}%
                      </span>
                      {totalChance !== 100 && ' (toplam %100 olmalı)'}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Başarılı - Embed Kodu */}
            {embedCode && (
              <TabsContent value="success" className="mt-3">
                <div className="text-center space-y-6 py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <Sparkles className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600">Çark Başarıyla Oluşturuldu!</h3>
                  <p className="text-sm text-muted-foreground">
                    Çarkınız Supabase'e kaydedildi. Aşağıdaki embed kodunu sitenize ekleyin.
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Embed Kodu</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(embedCode)
                        }}
                        className="h-8 px-2"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Kopyala
                      </Button>
                    </div>
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                      <code className="text-wrap break-all">{embedCode}</code>
                    </pre>
                  </div>

                  <div className="space-y-3 text-sm text-left bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="font-medium text-blue-900 dark:text-blue-100">📌 Sonraki Adımlar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Embed kodunu kopyalayın</li>
                      <li>Sitenizin HTML'ine ekleyin</li>
                      <li>API sunucusunu çalıştırın (Railway/Render)</li>
                      <li><code className="bg-muted px-1 rounded">widget.js</code> dosyasını aynı domain'e yükleyin</li>
                    </ol>
                  </div>

                  <Button
                    onClick={() => {
                      setActiveTab('store')
                      setFormData(initialFormData)
                      setLogoPreview(null)
                      setEmbedCode('')
                    }}
                    variant="outline"
                  >
                    Yeni Çark Oluştur
                  </Button>
                </div>
              </TabsContent>
            )}
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
            {embedCode ? (
              <Button onClick={() => setActiveTab('success')} className="w-full sm:min-w-[120px] bg-green-600 hover:bg-green-700 shadow-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Tamamlandı
              </Button>
            ) : activeTab === 'prizes' ? (
              <Button onClick={handleSubmit} disabled={!isFormValid || totalChance !== 100} className="w-full sm:min-w-[120px] shadow-lg shadow-primary/20">
                Çark Oluştur
              </Button>
            ) : (
              <Button onClick={handleNext} className="w-full shadow-sm">
                İleri
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
      </Sheet>
    </>
  )
}
