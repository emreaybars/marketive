'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, Phone, Search, Loader2, Star, Users, Sparkles } from 'lucide-react'
import { useWhatsApp } from './whatsapp-provider'
import { cn } from '@/lib/utils'
import type { WhatsAppContact } from '../types/whatsapp.types'

export function WhatsAppContactsDrawer() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [carkifelekContacts, setCarkifelekContacts] = useState<WhatsAppContact[]>([])
  const [loadingCarkifelek, setLoadingCarkifelek] = useState(false)
  const [importedContacts, setImportedContacts] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('all')

  const { contacts, setActiveContact, getCarkifelekContacts } = useWhatsApp()

  const filteredContacts = contacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone_number.includes(searchQuery)
  )

  const filteredCarkifelekContacts = carkifelekContacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone_number.includes(searchQuery)
  )

  // Load Çarkıfelek contacts when drawer opens
  useEffect(() => {
    if (open && activeTab === 'carkifelek' && carkifelekContacts.length === 0) {
      loadCarkifelekContacts()
    }
  }, [open, activeTab])

  const loadCarkifelekContacts = async () => {
    setLoadingCarkifelek(true)
    try {
      const data = await getCarkifelekContacts()
      setCarkifelekContacts(data)
    } catch (error) {
      console.error('Failed to load Çarkıfelek contacts:', error)
    } finally {
      setLoadingCarkifelek(false)
    }
  }

  const handleSelectContact = (contact: WhatsAppContact) => {
    setActiveContact(contact)
    setOpen(false)
  }

  const handleImportContact = async (contact: WhatsAppContact) => {
    setImportedContacts(prev => new Set(prev).add(contact.id))
    // The contact is already in the system from Çarkıfelek, just select it
    setTimeout(() => {
      setActiveContact(contact)
      setOpen(false)
    }, 500)
  }

  const existingPhoneNumbers = new Set(contacts.map(c => c.phone_number))

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="border-slate-200 dark:border-slate-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Yeni Sohbet
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <DrawerTitle className="text-lg">Yeni Sohbet Başlat</DrawerTitle>
                <DrawerDescription>Mesaj göndermek için bir kişi seçin</DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="İsim veya telefon numarası ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="all" className="gap-2">
                  <Users className="h-4 w-4" />
                  Tüm Rehber
                  <Badge variant="secondary" className="ml-1">{contacts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="carkifelek" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Çarkıfelek
                  <Badge variant="secondary" className="ml-1">{carkifelekContacts.length}</Badge>
                </TabsTrigger>
              </TabsList>

              {/* All contacts tab */}
              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[40vh]">
                  {filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Users className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm">Rehberinizde kimse yok</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => handleSelectContact(contact)}
                          className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                              {contact.full_name?.charAt(0).toUpperCase() || contact.phone_number.slice(-2)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {contact.full_name || 'Bilinmeyen'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {contact.phone_number}
                            </p>
                          </div>

                          {contact.tags?.includes('vip') && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Çarkıfelek contacts tab */}
              <TabsContent value="carkifelek" className="mt-0">
                <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Çarkıfelek Kazananları
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Çarkıfelek ödül kazanan ve telefon numarası paylaşan kişiler burada listelenir.
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[35vh]">
                  {loadingCarkifelek ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
                      <p className="text-sm text-slate-500">Yükleniyor...</p>
                    </div>
                  ) : filteredCarkifelekContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Sparkles className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm">Henüz kimse ödül kazanmadı</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredCarkifelekContacts.map((contact) => {
                        const alreadyImported = existingPhoneNumbers.has(contact.phone_number)
                        const isImporting = importedContacts.has(contact.id)

                        return (
                          <div
                            key={contact.id}
                            className={cn(
                              "p-3 rounded-xl transition-all",
                              alreadyImported
                                ? 'bg-slate-50 dark:bg-slate-900/50'
                                : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-11 w-11">
                                <AvatarFallback className={cn(
                                  "font-semibold text-sm",
                                  alreadyImported
                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                    : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                                )}>
                                  {contact.full_name?.charAt(0).toUpperCase() || contact.phone_number.slice(-2)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {contact.full_name || 'Bilinmeyen'}
                                  </p>
                                  {alreadyImported && (
                                    <Badge variant="secondary" className="text-xs">Mevcut</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone_number}
                                </p>
                              </div>

                              {isImporting ? (
                                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                              ) : alreadyImported ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectContact(contact)}
                                  className="h-8"
                                >
                                  Mesajlaş
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleImportContact(contact)}
                                  className="h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Ekle
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Add new contact manually */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" className="w-full justify-start" asChild>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Yeni Kişi Ekle</p>
                    <p className="text-xs text-slate-500">Telefon numarası ile ekle</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
