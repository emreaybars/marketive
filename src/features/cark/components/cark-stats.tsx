'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Mail, Phone, Ticket, Clock, Sparkles, ArrowUp, ArrowDown } from 'lucide-react'
import { useCark } from './cark-provider'

export function CarkStats() {
  const { analytics } = useCark()

  if (!analytics) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='overflow-hidden animate-pulse'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='h-4 w-24 bg-muted rounded' />
              <div className='h-8 w-8 bg-muted rounded-lg' />
            </CardHeader>
            <CardContent>
              <div className='h-7 w-20 bg-muted rounded mb-2' />
              <div className='h-3 w-32 bg-muted rounded' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      title: 'Günlük Çevirme',
      value: analytics.todaySpins.toLocaleString(),
      change: analytics.changeFromLastWeek >= 0
        ? `+${analytics.changeFromLastWeek.toFixed(1)}`
        : analytics.changeFromLastWeek.toFixed(1),
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      gradientFrom: 'from-blue-500/5',
      gradientTo: 'to-blue-500/0',
      description: 'Bugünkü toplam çark çevirme sayısı',
      positive: analytics.changeFromLastWeek >= 0,
    },
    {
      title: 'Toplam E-posta',
      value: analytics.totalEmails.toLocaleString(),
      change: '+0',
      icon: Mail,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      gradientFrom: 'from-emerald-500/5',
      gradientTo: 'to-emerald-500/0',
      description: 'Toplam e-posta toplama sayısı',
      positive: true,
    },
    {
      title: 'Toplam Telefon',
      value: analytics.totalPhones.toLocaleString(),
      change: '+0',
      icon: Phone,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      gradientFrom: 'from-orange-500/5',
      gradientTo: 'to-orange-500/0',
      description: 'Toplam telefon numarası toplama sayısı',
      positive: true,
    },
    {
      title: 'Kullanılan Kupon',
      value: 'Yakında',
      change: '',
      icon: Ticket,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      gradientFrom: 'from-purple-500/5',
      gradientTo: 'to-purple-500/0',
      description: 'Kupon kullanım istatistikleri yakında burada görüntülenecek.',
      positive: true,
      comingSoon: true,
    },
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="overflow-hidden relative transition-all hover:shadow-lg border"
        >
          {/* Inner gradient shimmer */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} opacity-60`} />

          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3 relative'>
            <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
            <div className={`rounded-xl p-2.5 ${stat.bgColor} shadow-sm`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {stat.comingSoon ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    Yakında
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border-purple-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Çok Yakında
                  </Badge>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <p>{stat.description}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  {stat.change !== '+0' && (
                    <Badge variant="outline" className={`text-xs ${stat.positive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                      {stat.positive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      {Math.abs(parseFloat(stat.change))}%
                    </Badge>
                  )}
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Sparkles className={`h-3.5 w-3.5 ${stat.color} shrink-0 mt-0.5 opacity-70`} />
                  <p>{stat.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
