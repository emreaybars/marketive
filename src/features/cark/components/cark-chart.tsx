'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'
import { useCark } from './cark-provider'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

const primaryColor = 'oklch(0.62 0.19 252)'

type DateRangeType = '7d' | '15d' | '30d' | '60d' | '90d' | 'all' | 'custom'

export function CarkChart() {
  const { analytics } = useCark()
  const [dateRangeType, setDateRangeType] = React.useState<DateRangeType>('all')
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)

  // Custom tarih range kontrolü
  const isCustomRange = dateRangeType === 'custom'

  // Veriyi filtrele - analytics'ten gerçek veriyi kullan
  const filteredData = React.useMemo(() => {
    if (!analytics || !analytics.dailyStats || analytics.dailyStats.length === 0) {
      return []
    }

    let data = [...analytics.dailyStats]

    if (isCustomRange && startDate && endDate) {
      return data.filter((item) => {
        const date = new Date(item.date)
        return date >= startDate && date <= endDate
      })
    }

    // Tarih aralığı filtreleri
    if (dateRangeType === 'all') {
      return data
    }

    const now = new Date()
    let daysToSubtract = 30
    if (dateRangeType === '7d') daysToSubtract = 7
    else if (dateRangeType === '15d') daysToSubtract = 15
    else if (dateRangeType === '30d') daysToSubtract = 30
    else if (dateRangeType === '60d') daysToSubtract = 60
    else if (dateRangeType === '90d') daysToSubtract = 90

    const start = new Date(now)
    start.setDate(start.getDate() - daysToSubtract)
    start.setHours(0, 0, 0, 0)

    return data.filter((item) => {
      const date = new Date(item.date)
      return date >= start
    })
  }, [analytics, dateRangeType, startDate, endDate, isCustomRange])

  // Toplam ve ortalama hesapla
  const totalSpins = React.useMemo(() => {
    if (filteredData.length === 0) return 0
    return filteredData.reduce((sum, item) => sum + item.spins, 0)
  }, [filteredData])

  const avgSpins = React.useMemo(() => {
    if (filteredData.length === 0) return 0
    return Math.round(totalSpins / filteredData.length)
  }, [filteredData, totalSpins])

  const maxSpins = React.useMemo(() => {
    if (filteredData.length === 0) return 0
    return Math.max(...filteredData.map(d => d.spins))
  }, [filteredData])

  // X-axis için hangi index'lerin gösterileceğini hesapla (mobil için daha az etiket)
  const tickIndices = React.useMemo(() => {
    const dataLength = filteredData.length

    // Mobil için çok daha az etiket
    if (dataLength <= 7) return [0, dataLength - 1] // İlk ve son
    if (dataLength <= 15) return [0, Math.floor(dataLength / 2), dataLength - 1] // İlk, orta, son
    if (dataLength <= 30) return [0, Math.floor(dataLength / 3), Math.floor(2 * dataLength / 3), dataLength - 1] // 4 etiket
    if (dataLength <= 60) return [0, Math.floor(dataLength / 4), Math.floor(dataLength / 2), Math.floor(3 * dataLength / 4), dataLength - 1] // 5 etiket
    return [0, Math.floor(dataLength / 6), Math.floor(dataLength / 3), Math.floor(dataLength / 2), Math.floor(2 * dataLength / 3), Math.floor(5 * dataLength / 6), dataLength - 1] // 7 etiket max
  }, [filteredData.length])

  // Tick gösterimi için fonksiyon
  const shouldShowTick = (index: number) => tickIndices.includes(index)

  // Tarih aralığı açıklaması
  const getDateRangeLabel = () => {
    if (isCustomRange && startDate && endDate) {
      return `${startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`
    }
    const labels: Record<DateRangeType, string> = {
      '7d': 'Son 7 gün',
      '15d': 'Son 15 gün',
      '30d': 'Son 30 gün',
      '60d': 'Son 60 gün',
      '90d': 'Son 90 gün',
      'all': 'Tüm Zamanlar',
      'custom': 'Özel tarih'
    }
    return labels[dateRangeType]
  }

  // Tarih seçimi yapıldığında
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date)
    setDateRangeType('custom')
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date)
    setDateRangeType('custom')
  }

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Çark Çevirme İstatistikleri</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
              <Calendar className="h-3 w-3" />
              {getDateRangeLabel()} çark çevirme verisi
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {/* İstatistik Badge'leri */}
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                <span className="text-muted-foreground">Toplam:</span>{' '}
                <span className="font-semibold text-primary">{totalSpins.toLocaleString()}</span>
              </Badge>
              <Badge variant="secondary" className="font-normal">
                <span className="text-muted-foreground">Ort:</span>{' '}
                <span className="font-semibold">{avgSpins}</span>
              </Badge>
            </div>

            {/* Tarih aralığı seçimi */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <Select value={dateRangeType} onValueChange={(v) => setDateRangeType(v as DateRangeType)}>
                <SelectTrigger className="w-[90px] sm:w-[130px] h-8 text-xs" aria-label="Tarih aralığı">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl" align="end">
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">Tümü</span>
                      <span className="text-muted-foreground text-xs">Tüm Zamanlar</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="7d">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">7 Gün</span>
                      <span className="text-muted-foreground text-xs">Haftalık</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="15d">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">15 Gün</span>
                      <span className="text-muted-foreground text-xs">2 Hafta</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="30d">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">30 Gün</span>
                      <span className="text-muted-foreground text-xs">Aylık</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="60d">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">60 Gün</span>
                      <span className="text-muted-foreground text-xs">2 Ay</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="90d">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">90 Gün</span>
                      <span className="text-muted-foreground text-xs">3 Ay</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="custom">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">Özel Tarih</span>
                      <span className="text-muted-foreground text-xs">Seçiniz</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Özel tarih seçim popovers - sadece custom modda göster */}
              {isCustomRange && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 sm:w-auto sm:px-3 text-xs p-0 sm:p-auto"
                        onClick={() => setDateRangeType('custom')}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline ml-1">
                          {startDate ? startDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : 'Başlangıç'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateSelect}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 sm:w-auto sm:px-3 text-xs p-0 sm:p-auto"
                        onClick={() => setDateRangeType('custom')}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline ml-1">
                          {endDate ? endDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : 'Bitiş'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateSelect}
                        initialFocus
                        disabled={(date) => {
                          if (!startDate) return date > new Date()
                          return date < startDate || date > new Date()
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Sıfırla butonu */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 sm:w-auto sm:px-2 text-xs p-0 sm:p-auto"
                    onClick={() => {
                      setDateRangeType('all')
                      setStartDate(undefined)
                      setEndDate(undefined)
                    }}
                  >
                    ✕
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobil istatistikler */}
        <div className="flex sm:hidden gap-2 pt-2">
          <Badge variant="secondary" className="font-normal text-xs">
            <span className="text-muted-foreground">Toplam:</span>{' '}
            <span className="font-semibold text-primary">{totalSpins.toLocaleString()}</span>
          </Badge>
          <Badge variant="secondary" className="font-normal text-xs">
            <span className="text-muted-foreground">Ort:</span>{' '}
            <span className="font-semibold">{avgSpins}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-6">
        {/* Empty state */}
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Henüz veri yok</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Çark çevirme istatistikleri burada görüntülenecek. İlk çarkınızı oluşturun ve kullanıcılarınızın etkileşimini takip etmeye başlayın.
            </p>
          </div>
        ) : (
          <>
        {/* Yatay scroll ile chart alanı */}
        <div className="relative overflow-x-auto pb-2">
          {/* Scroll indicator - mobilde */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-end gap-1 px-2 pointer-events-none sm:hidden">
            <div className="h-1 w-8 rounded-full bg-primary/20" />
            <div className="h-1 w-2 rounded-full bg-primary/40" />
          </div>

          <div className="min-w-[500px]">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSpins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity={0.4} />
                    <stop offset="50%" stopColor={primaryColor} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSpinsLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={(value, index) => {
                    // Mobilde sadece belirli index'leri göster
                    if (shouldShowTick(index)) {
                      const date = new Date(value)
                      // Sadece gün numarası - daha kısa format
                      return date.getDate().toString()
                    }
                    return ''
                  }}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  interval={0}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 500,
                    fontSize: '12px',
                  }}
                  itemStyle={{
                    color: primaryColor,
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                  formatter={(value?: number) => value?.toLocaleString() ?? '0'}
                  labelFormatter={(label) => {
                    const date = new Date(label)
                    return date.toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  }}
                />

                <Area
                  dataKey="spins"
                  name="Çark Çevirme"
                  type="monotone"
                  stroke="url(#colorSpinsLine)"
                  strokeWidth={2.5}
                  fill="url(#colorSpins)"
                  activeDot={{ r: 5, stroke: primaryColor, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  dot={false}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alt bilgi - max değer */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>En yüksek:</span>
          <span className="font-semibold text-primary">{maxSpins.toLocaleString()}</span>
          <span>çark çevirme</span>
        </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
