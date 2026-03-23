'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plug, Wrench, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useCark } from './cark-provider'
import { toast } from 'sonner'

type PlatformType = 'ikas' | 'ticimax' | 'shopify' | 'custom' | null

export function CarkIntegrationDialog() {
  const [open, setOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testSuccessful, setTestSuccessful] = useState(false)
  const { upsertShopIntegration, syncOrdersFromIntegration } = useCark()

  const platforms = [
    { id: 'ikas', label: 'İkas' },
    { id: 'ticimax', label: 'Ticimax' },
    { id: 'shopify', label: 'Shopify' },
    { id: 'custom', label: 'Geliştir E-Ticaret' },
  ]

  const handleTest = async () => {
    if (!username || !password || !storeName) {
      toast.error('Lütfen kullanıcı adı, şifre ve mağaza adı girin')
      return
    }

    setIsTesting(true)
    setTestSuccessful(false)

    try {
      // Backend API üzerinden test et (CORS sorunu olmaması için)
      const response = await fetch('/api/cark/test-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          storeName
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'API bağlantı hatası')
      }

      const data = await response.json()

      // API yanıtını kontrol et
      if (data.success && data.data) {
        setIsTesting(false)
        setTestSuccessful(true)
        toast.success(`Bağlantı testi başarılı! ${data.data.total || 0} sipariş bulundu.`)

        // Test başarılı olursa otomatik kaydet
        setTimeout(async () => {
          const result = await upsertShopIntegration(selectedPlatform!, username, password, storeName)
          if (result.success) {
            toast.success('Entegrasyon başarıyla kaydedildi')

            // Sipariş senkronizasyonunu başlat
            const syncResult = await syncOrdersFromIntegration()
            if (syncResult.success && syncResult.data) {
              const updated = syncResult.data.recordsUpdated || 0
              const matches = syncResult.data.matchesFound || 0

              toast.success(`${syncResult.data.ordersFetched || 0} sipariş işlendi, ${matches} eşleşme bulundu, ${updated} kayıt güncellendi`)
            }

            setOpen(false)
            handleReset()
          } else {
            toast.error(result.error || 'Entegrasyon kaydedilemedi')
            setTestSuccessful(false)
          }
        }, 500)
      } else {
        throw new Error(data.error || 'API yanıt hatası')
      }
    } catch (error: any) {
      setIsTesting(false)
      toast.error(error.message || 'Bağlantı testi başarısız. Lütfen bilgilerinizi kontrol edin.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submit'i kullanılmıyor, test başarılı olursa otomatik kaydediliyor
  }

  const handleReset = () => {
    setSelectedPlatform(null)
    setUsername('')
    setPassword('')
    setStoreName('')
    setTestSuccessful(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) handleReset()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plug className="mr-2 h-4 w-4" />
          Entegrasyon
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Platform Entegrasyonu</DialogTitle>
          <DialogDescription>
            E-ticaret platformunuzu veya özel entegrasyonunuzu seçin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Platform Seçimi */}
            <div className="space-y-3">
              <Label>Platform Seçin</Label>
              <RadioGroup value={selectedPlatform || ''} onValueChange={(value) => setSelectedPlatform(value as PlatformType)}>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="relative">
                      <RadioGroupItem
                        value={platform.id}
                        id={platform.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={platform.id}
                        className={`
                          flex flex-col items-center justify-center gap-2 rounded-lg border-2
                          p-4 cursor-pointer transition-all hover:bg-accent/50
                          peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                          peer-data-[state=checked]:text-foreground
                        `}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                          {/* Placeholder for platform logo */}
                          <span className="text-xs text-muted-foreground">{platform.id}</span>
                        </div>
                        <span className="text-sm font-medium">{platform.label}</span>
                        {(platform.id === 'ikas' || platform.id === 'ticimax' || platform.id === 'shopify') ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">Bakımda</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-500 font-medium">Aktif</span>
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Bakımda Mesajı - ikas, ticimax, shopify için */}
            {(selectedPlatform === 'ikas' || selectedPlatform === 'ticimax' || selectedPlatform === 'shopify') && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Bakımda
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Bu platform entegrasyonu şu anda bakımda. Yakında aktif olacak.
                  </p>
                </div>
              </div>
            )}

            {/* Geliştirici Form Alanları - custom için */}
            {selectedPlatform === 'custom' && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">API Bilgileri</h4>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="username">Kullanıcı Adı</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="API kullanıcı adınız"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setTestSuccessful(false)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="API şifreniz"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setTestSuccessful(false)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Mağaza Adı</Label>
                    <Input
                      id="storeName"
                      type="text"
                      placeholder="örn: test (test.butiksistem.com için)"
                      value={storeName}
                      onChange={(e) => {
                        setStoreName(e.target.value)
                        setTestSuccessful(false)
                      }}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      ButikSistem mağaza alt adınız (subdomain)
                    </p>
                  </div>
                </div>

                {/* Test Sonucu Mesajı */}
                {testSuccessful && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      Bağlantı başarılı! Entegrasyon kaydediliyor...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            {selectedPlatform === 'custom' && (
              <Button
                type="button"
                onClick={handleTest}
                disabled={!username || !password || !storeName || isTesting || testSuccessful}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test Ediliyor...
                  </>
                ) : testSuccessful ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Test Et'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
