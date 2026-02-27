'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Copy, Check, Code, ExternalLink } from 'lucide-react'

export function CarkIntegrationDialog() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'script' | 'widget' | null>(null)
  const [customDomain, setCustomDomain] = useState('')

  // Script kodu
  const scriptCode = `<script src="https://carkifelek.io/widget.js" data-wheel-id="YOUR_WHEEL_ID"></script>`

  // Widget kodu (domain ile dinamik)
  const widgetCode = `<div id="cark-widget" data-wheel-id="YOUR_WHEEL_ID"${customDomain ? ` data-domain="${customDomain}"` : ''}></div>
<script src="https://carkifelek.io/widget.js"></script>`

  const copyToClipboard = useCallback((code: string, type: 'script' | 'widget') => {
    navigator.clipboard.writeText(code)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Code className="mr-2 h-4 w-4" />
          Entegrasyon Kodu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Entegrasyon Kodu</DialogTitle>
          <DialogDescription>
            Çarkınızı web sitenize veya uygulamanza eklemek için aşağıdaki kodlardan birini kullanın.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="space-y-4">
            <div className="space-y-2">
              <Label>Script Etiketi</Label>
              <div className="relative">
                <Textarea
                  readOnly
                  className="font-mono text-xs bg-muted pr-24"
                  rows={4}
                  value={scriptCode}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-7"
                  onClick={() => copyToClipboard(scriptCode, 'script')}
                >
                  {copied === 'script' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Kopyala
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bu kodu sitenizin <code className="bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> veya{' '}
                <code className="bg-muted px-1 py-0.5 rounded">&lt;body&gt;</code> etiketinin içine ekleyin.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a href="#" className="text-sm text-primary hover:underline">
                Dokümantasyonu görüntüle
              </a>
            </div>
          </TabsContent>

          <TabsContent value="widget" className="space-y-4">
            <div className="space-y-2">
              <Label>Widget Kodu</Label>
              <div className="relative">
                <Textarea
                  readOnly
                  className="font-mono text-xs bg-muted pr-24"
                  rows={6}
                  value={widgetCode}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-7"
                  onClick={() => copyToClipboard(widgetCode, 'widget')}
                >
                  {copied === 'widget' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Kopyala
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bu kodu çarkın görünmesini istediğiniz yere ekleyin. Otomatik olarak responsive çalışır.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Özelleştirme</Label>
              <div className="space-y-2">
                <Input
                  placeholder="ornek-siteniz.com"
                  className="font-mono text-sm"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Belirli bir alan adı için widget'ı kısıtlamak istiyorsanız buraya yazın.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>Tüm entegrasyonlar SSL sertifikalıdır</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="#">
              <ExternalLink className="h-3 w-3 mr-1" />
              Yardım
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
