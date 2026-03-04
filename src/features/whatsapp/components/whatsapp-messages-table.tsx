'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { useWhatsApp } from './whatsapp-provider'

export function WhatsAppMessagesTable() {
  const { messages, loading } = useWhatsApp()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className='h-4 w-4 text-slate-400' />
      case 'delivered':
        return <CheckCircle2 className='h-4 w-4 text-blue-500' />
      case 'read':
        return <CheckCircle2 className='h-4 w-4 text-emerald-500' />
      case 'failed':
        return <AlertCircle className='h-4 w-4 text-red-500' />
      default:
        return <Clock className='h-4 w-4 text-slate-400' />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Gönderildi'
      case 'delivered':
        return 'Teslim Edildi'
      case 'read':
        return 'Okundu'
      case 'failed':
        return 'Başarısız'
      default:
        return 'Bekliyor'
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      sent: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      delivered: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      read: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      failed: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    }

    return variants[status] || variants.sent
  }

  if (loading) {
    return (
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <MessageCircle className='h-5 w-5 text-blue-500' />
            Son Mesajlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='animate-pulse'>
                <div className='rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-4 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded' />
                    <div className='h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded' />
                  </div>
                  <div className='h-4 w-full bg-slate-200 dark:bg-slate-800 rounded' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (messages.length === 0) {
    return (
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <MessageCircle className='h-5 w-5 text-blue-500' />
            Son Mesajlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-4 mb-4'>
              <MessageCircle className='h-8 w-8 text-blue-500' />
            </div>
            <h3 className='text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100'>Henüz mesaj yok</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400 max-w-xs'>
              İlk kampanyanızı gönderdiğinizde burada görüntülenecek.
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
          <MessageCircle className='h-5 w-5 text-blue-500' />
          Son Mesajlar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {messages.map((message) => (
            <div
              key={message.id}
              className='group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 p-4'
            >
              <div className='flex items-start justify-between gap-4 mb-2'>
                <div className='flex items-center gap-2'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800'>
                    <MessageCircle className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <p className='font-semibold text-slate-800 dark:text-slate-100 text-sm'>{message.phone}</p>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      {new Date(message.sent_at).toLocaleString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusBadge(message.status)}>
                  <span className='flex items-center gap-1.5'>
                    {getStatusIcon(message.status)}
                    {getStatusText(message.status)}
                  </span>
                </Badge>
              </div>
              <p className='text-sm text-slate-600 dark:text-slate-400 line-clamp-2 pl-12'>
                {message.message}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
