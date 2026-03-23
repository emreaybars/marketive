'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useWhatsApp } from './whatsapp-provider'

export function WhatsAppChart() {
  const { analytics, loading } = useWhatsApp()

  const chartData = React.useMemo(() => {
    if (!analytics?.dailyStats) return []

    return analytics.dailyStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      gönderilen: stat.sent,
      teslim: stat.delivered,
      okunma: stat.read,
    }))
  }, [analytics])

  if (loading) {
    return (
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <div className='h-6 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse' />
        </CardHeader>
        <CardContent>
          <div className='h-80 bg-slate-50 dark:bg-slate-900/20 rounded animate-pulse' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <BarChart3 className='h-5 w-5 text-blue-500' />
            Mesaj İstatistikleri
          </CardTitle>
          {/* Live indicator badge */}
          <div className='flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-blue-500'></span>
            </span>
            <span className='text-[10px] font-medium text-blue-600 dark:text-blue-400'>CANLI</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-80 text-center'>
            <BarChart3 className='h-12 w-12 text-slate-300 dark:text-slate-600 mb-4' />
            <h3 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>Henüz veri yok</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              Kampanyalar oluşturduğunuzda burada görüntülenecek.
            </p>
          </div>
        ) : (
          <div className='h-80 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id='colorSent' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='colorDelivered' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#60a5fa' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#60a5fa' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='colorRead' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#93c5fd' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#93c5fd' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke='rgba(148, 163, 184, 0.1)' />
              <XAxis
                dataKey='date'
                tick={{ fill: '#64748b', fontSize: 12 }}
                stroke='rgba(148, 163, 184, 0.5)'
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                stroke='rgba(148, 163, 184, 0.5)'
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                }}
              />
              <Area
                type='monotone'
                dataKey='gönderilen'
                stroke='#3b82f6'
                strokeWidth={2}
                fillOpacity={1}
                fill='url(#colorSent)'
              />
              <Area
                type='monotone'
                dataKey='teslim'
                stroke='#60a5fa'
                strokeWidth={2}
                fillOpacity={1}
                fill='url(#colorDelivered)'
              />
              <Area
                type='monotone'
                dataKey='okunma'
                stroke='#93c5fd'
                strokeWidth={2}
                fillOpacity={1}
                fill='url(#colorRead)'
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
