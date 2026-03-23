'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWhatsApp } from './whatsapp-provider'
import { MoreHorizontal, Send, Pause, Play, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

export function WhatsAppCampaignsList() {
  const { campaigns, loading } = useWhatsApp()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyLink = async (id: string) => {
    await navigator.clipboard.writeText(`https://wa.me/campaign/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <Send className='h-5 w-5 text-blue-500' />
            Mevcut Kampanyalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='animate-pulse'>
                <div className='rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-4 space-y-3'>
                  <div className='h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded' />
                  <div className='flex gap-2'>
                    <div className='h-9 flex-1 bg-slate-200 dark:bg-slate-800 rounded' />
                    <div className='h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <Send className='h-5 w-5 text-blue-500' />
            Mevcut Kampanyalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-4 mb-4'>
              <Send className='h-8 w-8 text-blue-500' />
            </div>
            <h3 className='text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100'>Henüz kampanyanız yok</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4'>
              İlk WhatsApp kamyanızı oluşturun ve hemen göndermeye başlayın!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
          <Send className='h-5 w-5 text-blue-500' />
          Mevcut Kampanyalar
          <Badge className='ml-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'>
            {campaigns.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {campaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className='group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300'
              style={{ animation: `fadeInUp 0.5s ease-out ${(index + 4) * 0.1}s both` }}
            >
              <div className='absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-transparent dark:from-blue-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

              <div className='relative p-5'>
                {/* Header */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-2'>{campaign.name}</h3>
                    <Badge
                      variant={campaign.status === 'active' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        campaign.status === 'active'
                          ? 'bg-blue-500 text-white'
                          : campaign.status === 'paused'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {campaign.status === 'active' ? 'Aktif' : campaign.status === 'paused' ? 'Durduruldu' : 'Tamamlandı'}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className='space-y-2 mb-4'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-slate-500 dark:text-slate-400'>Gönderilen</span>
                    <span className='font-semibold text-slate-700 dark:text-slate-300'>{campaign.sent.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-slate-500 dark:text-slate-400'>Teslim Edilen</span>
                    <span className='font-semibold text-slate-700 dark:text-slate-300'>{campaign.delivered.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-slate-500 dark:text-slate-400'>Okunma</span>
                    <span className='font-semibold text-slate-700 dark:text-slate-300'>{campaign.opened.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-slate-500 dark:text-slate-400'>Tıklama</span>
                    <span className='font-semibold text-slate-700 dark:text-slate-300'>{campaign.clicked.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 h-9 text-xs border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors'
                    onClick={() => handleCopyLink(campaign.id)}
                  >
                    {copiedId === campaign.id ? 'Kopyalandı!' : 'Linki Kopyala'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-9 w-9 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48 border-slate-200 dark:border-slate-800'>
                      <DropdownMenuItem className='text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'>
                        <Settings className='mr-2 h-4 w-4' />
                        Önizle
                      </DropdownMenuItem>
                      <DropdownMenuItem className='text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'>
                        {campaign.status === 'active' ? (
                          <>
                            <Pause className='mr-2 h-4 w-4' />
                            Durdur
                          </>
                        ) : (
                          <>
                            <Play className='mr-2 h-4 w-4' />
                            Başlat
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Bottom accent line */}
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
