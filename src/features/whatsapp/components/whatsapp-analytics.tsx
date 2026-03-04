'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, PieChart, TrendingUp, Smartphone } from 'lucide-react'
import { useWhatsApp } from './whatsapp-provider'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8', '#1e40af']

export function WhatsAppAnalytics() {
  const { campaigns, loading } = useWhatsApp()

  // Kampanya durum dağılımı
  const statusDistribution = React.useMemo(() => {
    const statusMap = new Map<string, number>()

    campaigns?.forEach(campaign => {
      const current = statusMap.get(campaign.status) || 0
      statusMap.set(campaign.status, current + 1)
    })

    let colorIndex = 0
    const statuses: { name: string; count: number; color: string; label: string }[] = []
    const labels: Record<string, string> = {
      active: 'Aktif',
      paused: 'Durduruldu',
      completed: 'Tamamlandı',
    }

    statusMap.forEach((count, name) => {
      statuses.push({ name, count, color: COLORS[colorIndex % COLORS.length], label: labels[name] || name })
      colorIndex++
    })

    return statuses.sort((a, b) => b.count - a.count)
  }, [campaigns])

  const pieData = React.useMemo(() => {
    return statusDistribution.map(status => ({
      name: status.label,
      value: status.count,
    }))
  }, [statusDistribution])

  // En performanslı kampanyalar
  const topCampaigns = React.useMemo(() => {
    if (!campaigns || campaigns.length === 0) return []

    return campaigns
      .map(c => ({
        name: c.name,
        rate: c.sent > 0 ? Math.round((c.clicked / c.sent) * 100) : 0,
        color: COLORS[campaigns.indexOf(c) % COLORS.length],
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [campaigns])

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
            <CardHeader>
              <div className='h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse' />
            </CardHeader>
            <CardContent>
              <div className='h-64 bg-slate-50 dark:bg-slate-900/20 rounded animate-pulse' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {/* Kampanya Durumları */}
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <Target className='h-5 w-5 text-blue-500' />
            Kampanya Durumları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusDistribution.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <Target className='h-12 w-12 text-slate-300 dark:text-slate-600 mb-4' />
              <h3 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>Henüz kampanya yok</h3>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                İlk kampanyanızı oluşturun ve burada görüntüleyin.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {statusDistribution.map((status) => (
                <div key={status.name} className='flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800'>
                  <div className='w-3 h-3 rounded-full shrink-0' style={{ backgroundColor: status.color }} />
                  <span className='font-medium text-slate-700 dark:text-slate-300'>{status.label}</span>
                  <Badge className='ml-auto bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'>
                    {status.count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Durum Dağılımı */}
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <PieChart className='h-5 w-5 text-blue-500' />
            Durum Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto pb-2'>
          {pieData.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <PieChart className='h-12 w-12 text-slate-300 dark:text-slate-600 mb-4' />
              <h3 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>Henüz veri yok</h3>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                Kampanyalar oluşturduğunuzda burada görüntülenecek.
              </p>
            </div>
          ) : (
            <div className='h-64 w-full min-w-[280px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx='50%'
                    cy='50%'
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey='value'
                    label={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign='bottom'
                    height={36}
                    iconType='circle'
                    formatter={(value) => <span className='text-slate-700 dark:text-slate-300 text-xs'>{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* En Performanslı Kampanyalar */}
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <TrendingUp className='h-5 w-5 text-blue-500' />
            En Performanslı Kampanyalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCampaigns.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <TrendingUp className='h-12 w-12 text-slate-300 dark:text-slate-600 mb-4' />
              <h3 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>Henüz kampanya yok</h3>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                İlk kampanyanızı oluşturun ve burada görüntüleyin.
              </p>
            </div>
          ) : (
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={topCampaigns} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' stroke='rgba(148, 163, 184, 0.1)' />
                  <XAxis
                    type='number'
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke='rgba(148, 163, 184, 0.5)'
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    width={100}
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
                    formatter={(value?: number) => value !== undefined ? [`%${value}`, 'Tıklama Oranı'] : ['', '']}
                  />
                  <Bar dataKey='rate' radius={[0, 8, 8, 0]}>
                    {topCampaigns.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cihaz Dağılımı */}
      <Card className='border border-slate-200 dark:border-slate-800 bg-white dark:bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-slate-800 dark:text-slate-100'>
            <Smartphone className='h-5 w-5 text-blue-500' />
            Cihaz Dağılımı
            <Badge className='ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'>
              Yakında
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-xs text-slate-500 dark:text-slate-400 mb-4'>
            Bu özellik yakında aktif olacak. Gerçek cihaz bilgileri mesajlardan toplanacak.
          </p>
          <div className='flex flex-col items-center justify-center h-40 text-center'>
            <Smartphone className='h-12 w-12 text-slate-300 dark:text-slate-600 mb-4' />
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              Veriler toplandığında burada görüntülenecek.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
