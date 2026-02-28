'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCark } from './cark-provider'
import { MoreHorizontal, Edit, Trash2, Copy, Eye, Store, Calendar, Sparkles, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

export function CarkWheelsList() {
  const { wheels, loading, deleteWheel } = useCark()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${name} çarkını silmek istediğinizden emin misiniz?`)) {
      await deleteWheel(id)
    }
  }

  const handleCopyEmbed = async (embedCode?: string, id?: string) => {
    if (embedCode) {
      await navigator.clipboard.writeText(embedCode)
      setCopiedId(id || null)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Mevcut Çarklar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 bg-muted rounded" />
                    <div className="h-9 w-9 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (wheels.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Mevcut Çarklar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Henüz çarkınız yok</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              İlk çarkınızı oluşturun ve hemen kazanmaya başlayın!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Mevcut Çarklar
          <Badge variant="secondary" className="ml-2">
            {wheels.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wheels.map((wheel) => (
            <div
              key={wheel.id}
              className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-lg hover:border-primary/50"
            >
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden border border-primary/10 shrink-0">
                    {wheel.logo_url ? (
                      <img
                        src={wheel.logo_url}
                        alt={wheel.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Store className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate pr-2">{wheel.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={wheel.active ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {wheel.active ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Store className="h-3 w-3" />
                    <span className="truncate">{wheel.shop_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(wheel.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => handleCopyEmbed(wheel.embed_code, wheel.id)}
                  >
                    {copiedId === wheel.id ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                        Entegrasyon Kodu Kopyalandı!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Entegrasyon Kodu
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Önizle
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(wheel.id, wheel.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
