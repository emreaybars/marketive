'use client'

import { useState } from 'react'
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
import { Plus, Sparkles, Copy, ArrowRight, MessageCircle, Smartphone, Globe, Zap } from 'lucide-react'

// Form veri tipi
interface IntegrationFormData {
  // API Bilgileri
  apiKey: string
  phoneNumber: string

  // Widget Ayarları
  widgetTitle: string
  widgetDescription: string
  buttonText: string
  position: 'bottom-right' | 'bottom-left' | 'custom'
  customColor: string

  // Mesaj Ayarları
  welcomeMessage: string
  autoReply: boolean
}

const initialFormData: IntegrationFormData = {
  apiKey: '',
  phoneNumber: '',
  widgetTitle: 'WhatsApp ile İletişime Geçin',
  widgetDescription: 'Sorularınız için bize yazın',
  buttonText: 'Mesaj Gönder',
  position: 'bottom-right',
  customColor: '#25D366',
  welcomeMessage: 'Merhaba! Size nasıl yardımcı olabilirim?',
  autoReply: true,
}

export function WhatsAppIntegrationDrawer() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'api' | 'widget' | 'messages' | 'success'>('api')
  const [embedCode, setEmbedCode] = useState<string>('')

  const [formData, setFormData] = useState<IntegrationFormData>(initialFormData)

  const handleSubmit = () => {
    // Validasyon
    if (!formData.apiKey.trim()) {
      alert('Lütfen API Anahtarı girin')
      return
    }
    if (!formData.phoneNumber.trim()) {
      alert('Lütfen WhatsApp Numarası girin')
      return
    }

    // Embed kodu oluştur
    const code = `<!-- WhatsApp Marketing Widget -->
<script id="whatsapp-marketing-script"
  data-api-key="${formData.apiKey}"
  data-phone="${formData.phoneNumber}"
  data-position="${formData.position}"
  data-color="${formData.customColor}"
  src="${window.location.origin}/whatsapp-widget.js">
</script>`
    setEmbedCode(code)
    setActiveTab('success')
  }

  const handleNext = () => {
    if (activeTab === 'api') setActiveTab('widget')
    else if (activeTab === 'widget') setActiveTab('messages')
  }

  const isFormValid = formData.apiKey.trim().length > 0 && formData.phoneNumber.trim().length > 0

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className='bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'>
            <Plus className="mr-2 h-4 w-4" />
            Entegrasyonu Başlat
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[550px] lg:w-[600px] p-0 gap-0 flex flex-col h-full">
          {/* Header */}
          <div className="relative flex items-center justify-between px-6 py-5 sm:px-8 sm:py-6 border-b bg-muted/30 shrink-0 pr-16 overflow-hidden">
            {/* Gradient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/10 shadow-lg shadow-emerald-500/10">
                <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500 drop-shadow-sm" />
              </div>
              <div>
                <SheetTitle className="text-lg sm:text-xl font-semibold">WhatsApp Entegrasyonu</SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">
                  Widget\'i adım adım özelleştirin
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className={`grid w-full mb-5 sm:mb-7 h-11 p-1 bg-muted/50 ${embedCode ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="api" className="text-sm">
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  API
                </TabsTrigger>
                <TabsTrigger value="widget" className="text-sm">
                  <Smartphone className="h-3.5 w-3.5 mr-1" />
                  Widget
                </TabsTrigger>
                <TabsTrigger value="messages" className="text-sm">
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  Mesajlar
                </TabsTrigger>
                {embedCode && (
                  <TabsTrigger value="success" className="text-sm text-emerald-600">
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Tamamlandı
                  </TabsTrigger>
                )}
              </TabsList>

              {/* API Ayarları */}
              <TabsContent value="api" className="space-y-5 sm:space-y-7 mt-3">
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      WhatsApp Business API Bilgileri
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      WhatsApp Business API anahtarınızı ve telefon numaranızı girin.
                    </p>
                  </div>

                  <Separator />

                  {/* API Anahtarı */}
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-sm font-medium">
                      API Anahtarı <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="apiKey"
                      placeholder="wa_api_xxxxxxxxxxxxx"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="h-9 sm:h-10 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      WhatsApp Business API anahtarınızı Meta for Developers'dan alın
                    </p>
                  </div>

                  {/* WhatsApp Numarası */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">
                      WhatsApp Numarası <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+905551234567"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      İşletme WhatsApp numaranız (ülke kodu ile birlikte)
                    </p>
                  </div>
                </div>

                {/* Bilgi Kartı */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm mb-1">
                        API Anahtarı Nasıl Alınır?
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-emerald-700 dark:text-emerald-300 ml-2">
                        <li>Meta for Developers'a gidin</li>
                        <li>WhatsApp Business API oluşturun</li>
                        <li>API anahtarınızı kopyalayın</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Widget Ayarları */}
              <TabsContent value="widget" className="space-y-5 sm:space-y-7 mt-3">
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Görünüm Ayarları
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Widget'inizin görünümünü özelleştirin.
                    </p>
                  </div>

                  <Separator />

                  {/* Widget Başlığı */}
                  <div className="space-y-2">
                    <Label htmlFor="widgetTitle" className="text-sm font-medium">Başlık</Label>
                    <Input
                      id="widgetTitle"
                      placeholder="WhatsApp ile İletişime Geçin"
                      value={formData.widgetTitle}
                      onChange={(e) => setFormData({ ...formData, widgetTitle: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>

                  {/* Widget Açıklaması */}
                  <div className="space-y-2">
                    <Label htmlFor="widgetDescription" className="text-sm font-medium">Açıklama</Label>
                    <Textarea
                      id="widgetDescription"
                      placeholder="Sorularınız için bize yazın"
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
                      placeholder="Mesaj Gönder"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>

                  {/* Pozisyon Seçimi */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Pozisyon</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'bottom-right', label: 'Sağ Alt' },
                        { value: 'bottom-left', label: 'Sol Alt' },
                      ].map((pos) => (
                        <label
                          key={pos.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.position === pos.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="position"
                            value={pos.value}
                            checked={formData.position === pos.value}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                            className="h-4 w-4 text-emerald-500"
                          />
                          <span className="text-sm">{pos.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Renk Seçimi */}
                  <div className="space-y-2">
                    <Label htmlFor="customColor" className="text-sm font-medium">Widget Rengi</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customColor"
                        value={formData.customColor}
                        onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                        className="flex-1 h-9 sm:h-9 font-mono text-sm"
                      />
                      <div
                        className="relative h-9 sm:h-9 w-12 cursor-pointer border-2 rounded-md"
                        style={{ borderColor: formData.customColor }}
                      >
                        <input
                          type="color"
                          value={formData.customColor}
                          onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-full h-full rounded-md" style={{ backgroundColor: formData.customColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Önizleme Kartı */}
                <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">Önizleme</div>
                  <div className="flex justify-center">
                    <div
                      className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                      style={{ backgroundColor: formData.customColor }}
                    >
                      <MessageCircle className="h-8 w-8 text-white" />
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Mesaj Ayarları */}
              <TabsContent value="messages" className="space-y-5 sm:space-y-7 mt-3">
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Mesaj Ayarları
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Otomatik mesaj ve karşılama ayarları.
                    </p>
                  </div>

                  <Separator />

                  {/* Karşılama Mesajı */}
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage" className="text-sm font-medium">Karşılama Mesajı</Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder="Merhaba! Size nasıl yardımcı olabilirim?"
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Müşteriler widget'i açtığında göreceği ilk mesaj
                    </p>
                  </div>

                  {/* Otomatik Cevap */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Otomatik Cevap</div>
                      <div className="text-xs text-muted-foreground">
                        Müşteri mesajlarına otomatik yanıt gönder
                      </div>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, autoReply: !formData.autoReply })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.autoReply ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          formData.autoReply ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Örnek Mesajlar */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Hızlı Mesaj Şablonları</Label>
                    <div className="space-y-2">
                      {[
                        'Ürün hakkında bilgi almak istiyorum',
                        'Kargo durumumu sorgulamak istiyorum',
                        'İade ve değişim politikası nedir?',
                        'Canlı destek ile görüşmek istiyorum',
                      ].map((template) => (
                        <button
                          key={template}
                          onClick={() => setFormData({ ...formData, welcomeMessage: template })}
                          className="w-full text-left p-3 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-sm"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Başarılı - Embed Kodu */}
              {embedCode && (
                <TabsContent value="success" className="mt-3">
                  <div className="text-center space-y-6 py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                      <Sparkles className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-600">Entegrasyon Başarılı!</h3>
                    <p className="text-sm text-muted-foreground">
                      WhatsApp widget ayarlarınız kaydedildi. Aşağıdaki embed kodunu sitenize ekleyin.
                    </p>

                    <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 text-left relative group">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-white">Embed Kodu</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(embedCode)
                          }}
                          className="h-8 px-2 bg-slate-800 hover:bg-slate-700 text-white"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Kopyala
                        </Button>
                      </div>
                      <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                        <code>{embedCode}</code>
                      </pre>
                    </div>

                    <div className="space-y-3 text-sm text-left bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                      <p className="font-medium text-blue-900 dark:text-blue-100">📌 Sonraki Adımlar:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Embed kodunu kopyalayın</li>
                        <li>Sitenizin HTML'ine &lt;body&gt; etiketinin içine yapıştırın</li>
                        <li>Sayfanızı yenileyin</li>
                        <li>Widget'in sağ alt köşede göründüğünü doğrulayın</li>
                      </ol>
                    </div>

                    <Button
                      onClick={() => {
                        setActiveTab('api')
                        setFormData(initialFormData)
                        setEmbedCode('')
                      }}
                      variant="outline"
                    >
                      Yeni Entegrasyon Oluştur
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
                <div className={`h-2 w-2 rounded-full transition-colors ${activeTab === 'api' ? 'bg-emerald-500' : 'bg-emerald-500/40'}`} />
                <div className={`h-2 w-2 rounded-full transition-colors ${activeTab === 'widget' ? 'bg-emerald-500' : activeTab === 'messages' ? 'bg-emerald-500/40' : 'bg-muted'}`} />
                <div className={`h-2 w-2 rounded-full transition-colors ${activeTab === 'messages' ? 'bg-emerald-500' : 'bg-muted'}`} />
              </div>
              <span className="text-xs text-muted-foreground">
                {activeTab === 'api' && '1 / 3 • API ayarları'}
                {activeTab === 'widget' && '2 / 3 • Görünüm'}
                {activeTab === 'messages' && '3 / 3 • Mesajlar'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {embedCode ? (
                <Button onClick={() => setActiveTab('success')} className="w-full sm:min-w-[120px] bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tamamlandı
                </Button>
              ) : activeTab === 'messages' ? (
                <Button onClick={handleSubmit} disabled={!isFormValid} className="w-full sm:min-w-[120px] bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                  Entegrasyon Oluştur
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
    </>
  )
}
