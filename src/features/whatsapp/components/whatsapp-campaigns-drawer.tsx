'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MessageSquare, Send, CalendarIcon, Users, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react'
import { useWhatsApp } from './whatsapp-provider'
import { cn } from '@/lib/utils'

export function WhatsAppCampaignsDrawer() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'details' | 'recipients' | 'review' | 'sending' | 'success'>('details')
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [sendType, setSendType] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  const { contacts, campaignsLoading, createCampaign } = useWhatsApp()

  const handleSend = async () => {
    setStep('sending')
    try {
      await createCampaign({
        name: campaignName,
        message,
        contacts: selectedContacts,
        scheduledFor: sendType === 'scheduled' ? scheduledDate : undefined,
      })
      setStep('success')
    } catch (error) {
      console.error('Failed to create campaign:', error)
      setStep('details')
    }
  }

  const resetForm = () => {
    setCampaignName('')
    setMessage('')
    setSendType('immediate')
    setScheduledDate(undefined)
    setSelectedContacts([])
    setStep('details')
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(resetForm, 300)
  }

  const selectedContactsCount = selectedContacts.length

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Toplu Mesaj
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DrawerTitle className="text-lg">WhatsApp Kampanyası Oluştur</DrawerTitle>
                  <DrawerDescription>
                    {step === 'details' && 'Kampanya detaylarını girin'}
                    {step === 'recipients' && 'Alıcıları seçin'}
                    {step === 'review' && 'Kampanyayı gözden geçirin'}
                    {step === 'sending' && 'Kampanya gönderiliyor...'}
                    {step === 'success' && 'Kampanya başarıyla oluşturuldu!'}
                  </DrawerDescription>
                </div>
              </div>

              {/* Step indicator */}
              {step !== 'sending' && step !== 'success' && (
                <div className="flex items-center gap-2">
                  {['details', 'recipients', 'review'].map((s, i) => (
                    <div key={s} className="flex items-center">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200',
                          step === s
                            ? 'bg-blue-500 text-white'
                            : ['details', 'recipients', 'review'].indexOf(step) > i
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        )}
                      >
                        {['details', 'recipients', 'review'].indexOf(step) > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      {i < 2 && (
                        <div
                          className={cn(
                            'w-8 h-0.5 mx-1 transition-all duration-200',
                            ['details', 'recipients', 'review'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DrawerHeader>

          <ScrollArea className="px-4 pb-4 max-h-[60vh]">
            {/* Step 1: Campaign Details */}
            {step === 'details' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name" className="text-sm font-medium">
                    Kampanya Adı <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="campaign-name"
                    placeholder="Örn: Haftalık indirim duyurusu"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    Mesaj İçeriği <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Mesajınızı yazın... 👋&#10;&#10;Merhaba {isim},&#10;Bu hafta size özel %20 indirim fırsatını kaçırmayın!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    {message.length} karakter · {message.split(/\s+/).filter(Boolean).length} kelime
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Gönderim Zamanı</Label>
                  <RadioGroup value={sendType} onValueChange={(v: any) => setSendType(v)}>
                    <div
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer',
                        sendType === 'immediate'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                      onClick={() => setSendType('immediate')}
                    >
                      <RadioGroupItem value="immediate" id="immediate" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-blue-500" />
                          <Label htmlFor="immediate" className="font-semibold cursor-pointer">
                            Hemen Gönder
                          </Label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Mesajlarınız hemen gönderilecek</p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer',
                        sendType === 'scheduled'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                      onClick={() => setSendType('scheduled')}
                    >
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <Label htmlFor="scheduled" className="font-semibold cursor-pointer">
                            Zamanlanmış Gönderim
                          </Label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Belirlediğiniz tarihte gönderilecek</p>
                      </div>
                    </div>
                  </RadioGroup>

                  {sendType === 'scheduled' && (
                    <div className="pl-7">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal h-11',
                              !scheduledDate && 'text-slate-400'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? (
                              format(scheduledDate, 'PPP', { locale: tr })
                            ) : (
                              'Tarih seçin'
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Recipients */}
            {step === 'recipients' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm">Seçilen Kişiler</p>
                      <p className="text-xs text-slate-500">
                        {selectedContactsCount} / {contacts.length} kişi
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContacts(contacts.map(c => c.id))}
                    disabled={contacts.length === 0}
                  >
                    Tümünü Seç
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Henüz rehberinizde kimse yok</p>
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                          selectedContacts.includes(contact.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        )}
                        onClick={() => {
                          setSelectedContacts(prev =>
                            prev.includes(contact.id)
                              ? prev.filter(id => id !== contact.id)
                              : [...prev, contact.id]
                          )
                        }}
                      >
                        <div className="flex-1 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {contact.full_name?.charAt(0).toUpperCase() || contact.phone_number.slice(-2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {contact.full_name || contact.phone_number}
                            </p>
                            <p className="text-xs text-slate-500">{contact.phone_number}</p>
                          </div>
                        </div>
                        {selectedContacts.includes(contact.id) && (
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{campaignName}</h3>
                      <p className="text-blue-100 text-sm">Kampanyanız hazır!</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 mb-2">Mesaj Önizlemesi</p>
                    <p className="text-sm whitespace-pre-wrap">{message}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 mb-1">Alıcı Sayısı</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {selectedContactsCount}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 mb-1">Gönderim Zamanı</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {sendType === 'immediate' ? 'Hemen' : scheduledDate ? format(scheduledDate, 'PPP', { locale: tr }) : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 mb-2">Seçilen Kişiler</p>
                    <div className="flex flex-wrap gap-2">
                      {contacts
                        .filter(c => selectedContacts.includes(c.id))
                        .slice(0, 10)
                        .map(contact => (
                          <Badge key={contact.id} variant="secondary" className="text-xs">
                            {contact.full_name || contact.phone_number}
                          </Badge>
                        ))}
                      {selectedContactsCount > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          +{selectedContactsCount - 10} daha
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Sending */}
            {step === 'sending' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Kampanyanız gönderiliyor...
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Lütfen bekleyin, bu işlem birkaç sürebilir.
                </p>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Kampanya Başarılı!
                </p>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                  {campaignName} kampanyanız {selectedContactsCount} kişiye başarıyla oluşturuldu.
                </p>
              </div>
            )}
          </ScrollArea>

          <DrawerFooter className="border-t border-slate-200 dark:border-slate-800 pt-4">
            {step === 'details' && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  İptal
                </Button>
                <Button
                  onClick={() => setStep('recipients')}
                  disabled={!campaignName.trim() || !message.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  İleri
                </Button>
              </div>
            )}

            {step === 'recipients' && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                  Geri
                </Button>
                <Button
                  onClick={() => setStep('review')}
                  disabled={selectedContactsCount === 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  İleri
                </Button>
              </div>
            )}

            {step === 'review' && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('recipients')} className="flex-1">
                  Geri
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={campaignsLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {campaignsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {campaignsLoading ? 'Gönderiliyor...' : 'Gönder'}
                </Button>
              </div>
            )}

            {step === 'success' && (
              <Button onClick={handleClose} className="w-full bg-blue-500 hover:bg-blue-600">
                Tamamlandı
              </Button>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
