'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, PieChart, TrendingUp, Smartphone, Monitor, Tablet } from 'lucide-react'
import { useCark } from './cark-provider'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857']

export function CarkPrizeAnalytics() {
  const { wheels, wheelSpins, loading } = useCark()

  // Tüm ödülleri topla (wheel tanımları)
  const allPrizes = React.useMemo(() => {
    const prizes: { name: string; count: number; color: string }[] = []
    const prizeMap = new Map<string, number>()

    wheels?.forEach(wheel => {
      wheel.prizes?.forEach(prize => {
        const current = prizeMap.get(prize.name) || 0
        prizeMap.set(prize.name, current + 1)
      })
    })

    let colorIndex = 0
    prizeMap.forEach((count, name) => {
      prizes.push({ name, count, color: COLORS[colorIndex % COLORS.length] })
      colorIndex++
    })

    return prizes.sort((a, b) => b.count - a.count)
  }, [wheels])

  // Ödül dağılımı verisi
  const pieData = React.useMemo(() => {
    return allPrizes.map(prize => ({
      name: prize.name,
      value: prize.count,
    }))
  }, [allPrizes])

  // En çok KAZANILAN ödüller (wheelSpins'ten)
  const topWonPrizes = React.useMemo(() => {
    const prizeMap = new Map<string, number>()

    wheelSpins?.forEach(spin => {
      const prizeName = spin.prize_name
      const current = prizeMap.get(prizeName) || 0
      prizeMap.set(prizeName, current + 1)
    })

    let colorIndex = 0
    const prizes: { name: string; count: number; color: string }[] = []
    prizeMap.forEach((count, name) => {
      prizes.push({ name, count, color: COLORS[colorIndex % COLORS.length] })
      colorIndex++
    })

    return prizes.sort((a, b) => b.count - a.count).slice(0, 5)
  }, [wheelSpins])

  // Cihaz dağılımı - mock data (gerçek device bilgisi veritabanında yok)
  const deviceData = React.useMemo(() => {
    return [
      { name: 'Mobil', value: 65, icon: Smartphone, color: '#10b981' },
      { name: 'Masaüstü', value: 30, icon: Monitor, color: '#34d399' },
      { name: 'Tablet', value: 5, icon: Tablet, color: '#6ee7b7' },
    ]
  }, [])

  // Test verileri
  const testPrizes = [
    { name: '%50 İndirim', count: 45, color: COLORS[0] },
    { name: 'Ücretsiz Kargo', count: 32, color: COLORS[1] },
    { name: '100 TL Hediye Çeki', count: 28, color: COLORS[2] },
    { name: '2. Alana 1 Bedava', count: 18, color: COLORS[3] },
    { name: 'Special Ürün', count: 12, color: COLORS[4] },
    { name: 'Teşekkürler', count: 8, color: COLORS[5] },
  ]

  const testPieData = testPrizes.map(p => ({ name: p.name, value: p.count }))
  const testWonPrizes = [
    { name: '%50 İndirim', count: 128, color: COLORS[0] },
    { name: 'Ücretsiz Kargo', count: 95, color: COLORS[1] },
    { name: '100 TL Hediye Çeki', count: 67, color: COLORS[2] },
    { name: '2. Alana 1 Bedava', count: 42, color: COLORS[3] },
    { name: 'Special Ürün', count: 28, color: COLORS[4] },
  ]

  // Display data - use real data if available, otherwise test data
  const displayPrizes = allPrizes.length > 0 ? allPrizes : testPrizes
  const displayPieData = allPrizes.length > 0 ? pieData : testPieData
  const displayWonPrizes = topWonPrizes.length > 0 ? topWonPrizes : testWonPrizes
  const showTestData = !wheels || wheels.length === 0

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
            <CardHeader>
              <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-slate-50 dark:bg-slate-900/20 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Ödüller Listesi */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Trophy className="h-5 w-5 text-emerald-500" />
            Ödüller
            {showTestData && (
              <Badge className="ml-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                Demo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayPrizes.slice(0, 6).map((prize) => (
              <div key={prize.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: prize.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">{prize.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ödül Dağılımı */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <PieChart className="h-5 w-5 text-emerald-500" />
            Ödül Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-2">
          <div className="h-64 w-full min-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                >
                  {displayPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300 text-xs">{value}</span>}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* En Çok Kazanılan Ödüller */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            En Çok Kazanılan Ödüller
            {wheelSpins && wheelSpins.length > 0 && (
              <Badge className="ml-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                {wheelSpins.length} dönüş
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayWonPrizes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Trophy className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Henüz kazanılan ödül yok</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Çark çevrildiğinde burada kazanılan ödüller görüntülenecek.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayWonPrizes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="rgba(148, 163, 184, 0.5)"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    width={80}
                    stroke="rgba(148, 163, 184, 0.5)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {displayWonPrizes.map((_, index) => (
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
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Smartphone className="h-5 w-5 text-emerald-500" />
            Cihaz Dağılımı
            <Badge className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
              Demo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Bu özellik yakında aktif olacak. Gerçek cihaz bilgileri widgetten toplanacak.
          </p>
          <div className="space-y-4">
            {deviceData.map((device) => (
              <div key={device.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <device.icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{device.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">%{device.value}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${device.value}%`,
                      backgroundColor: device.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
