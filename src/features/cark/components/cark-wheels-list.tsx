'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCark } from './cark-provider'
import type { Wheel } from './cark-provider'
import { MoreHorizontal, Edit, Trash2, Store, Calendar, Sparkles, Check, Code, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { WheelPreview } from './wheel-preview'
import { CarkEditDrawer } from './cark-edit-drawer'

export function CarkWheelsList() {
  const { wheels, loading, deleteWheel } = useCark()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null)

  const handleEdit = (wheel: Wheel) => {
    setSelectedWheel(wheel)
    setEditDrawerOpen(true)
  }

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
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Store className="h-5 w-5 text-blue-500" />
            Mevcut Çarklar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded" />
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
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Store className="h-5 w-5 text-blue-500" />
            Mevcut Çarklar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Henüz çarkınız yok</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
              İlk çarkınızı oluşturun ve hemen kazanmaya başlayın!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Store className="h-5 w-5 text-blue-500" />
          Mevcut Çarklar
          <Badge className="ml-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            {wheels.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wheels.map((wheel, index) => (
            <div
              key={wheel.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
              style={{ animation: `fadeInUp 0.5s ease-out ${(index + 4) * 0.1}s both` }}
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-transparent dark:from-blue-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Wheel Preview */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl" />
                    {wheel.prizes && wheel.prizes.length >= 3 ? (
                      <WheelPreview
                        prizes={wheel.prizes.map(p => ({
                          id: p.id,
                          name: p.name,
                          color: p.color,
                          chance: p.chance
                        }))}
                        size={60}
                        showOuterRing={false}
                      />
                    ) : (
                      <div className="relative h-[60px] w-[60px] rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800">
                        {wheel.logo_url ? (
                          <img
                            src={wheel.logo_url}
                            alt={wheel.name}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate pr-2">{wheel.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={wheel.active ? 'default' : 'secondary'}
                            className={`text-xs ${
                              wheel.active
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {wheel.active ? 'Aktif' : 'Pasif'}
                          </Badge>
                          {wheel.prizes && wheel.prizes.length >= 3 && (
                            <Badge className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {wheel.prizes.length} ödül
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Store className="h-3.5 w-3.5 text-blue-500" />
                    <span className="truncate font-mono">{wheel.shop_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
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
                    className="flex-1 h-9 text-xs border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    onClick={() => handleCopyEmbed(wheel.embed_code, wheel.id)}
                  >
                    {copiedId === wheel.id ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Kopyalandı!
                      </>
                    ) : (
                      <>
                        <Code className="mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        Entegrasyon Kodu
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-slate-200 dark:border-slate-800">
                      <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Settings className="mr-2 h-4 w-4" />
                        Önizle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => handleEdit(wheel)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDelete(wheel.id, wheel.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Edit Drawer */}
    <CarkEditDrawer
      open={editDrawerOpen}
      onOpenChange={setEditDrawerOpen}
      wheel={selectedWheel}
    />
    </>
  )
}
