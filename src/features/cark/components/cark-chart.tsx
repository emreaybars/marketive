'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'

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

const chartData = [
  { date: '2024-04-01', spins: 222 },
  { date: '2024-04-02', spins: 97 },
  { date: '2024-04-03', spins: 167 },
  { date: '2024-04-04', spins: 242 },
  { date: '2024-04-05', spins: 373 },
  { date: '2024-04-06', spins: 301 },
  { date: '2024-04-07', spins: 245 },
  { date: '2024-04-08', spins: 409 },
  { date: '2024-04-09', spins: 59 },
  { date: '2024-04-10', spins: 261 },
  { date: '2024-04-11', spins: 327 },
  { date: '2024-04-12', spins: 292 },
  { date: '2024-04-13', spins: 342 },
  { date: '2024-04-14', spins: 137 },
  { date: '2024-04-15', spins: 120 },
  { date: '2024-04-16', spins: 138 },
  { date: '2024-04-17', spins: 446 },
  { date: '2024-04-18', spins: 364 },
  { date: '2024-04-19', spins: 243 },
  { date: '2024-04-20', spins: 89 },
  { date: '2024-04-21', spins: 137 },
  { date: '2024-04-22', spins: 224 },
  { date: '2024-04-23', spins: 138 },
  { date: '2024-04-24', spins: 387 },
  { date: '2024-04-25', spins: 215 },
  { date: '2024-04-26', spins: 75 },
  { date: '2024-04-27', spins: 383 },
  { date: '2024-04-28', spins: 122 },
  { date: '2024-04-29', spins: 315 },
  { date: '2024-04-30', spins: 454 },
  { date: '2024-05-01', spins: 165 },
  { date: '2024-05-02', spins: 293 },
  { date: '2024-05-03', spins: 247 },
  { date: '2024-05-04', spins: 385 },
  { date: '2024-05-05', spins: 481 },
  { date: '2024-05-06', spins: 498 },
  { date: '2024-05-07', spins: 388 },
  { date: '2024-05-08', spins: 149 },
  { date: '2024-05-09', spins: 227 },
  { date: '2024-05-10', spins: 293 },
  { date: '2024-05-11', spins: 335 },
  { date: '2024-05-12', spins: 197 },
  { date: '2024-05-13', spins: 197 },
  { date: '2024-05-14', spins: 448 },
  { date: '2024-05-15', spins: 473 },
  { date: '2024-05-16', spins: 338 },
  { date: '2024-05-17', spins: 499 },
  { date: '2024-05-18', spins: 315 },
  { date: '2024-05-19', spins: 235 },
  { date: '2024-05-20', spins: 177 },
  { date: '2024-05-21', spins: 82 },
  { date: '2024-05-22', spins: 81 },
  { date: '2024-05-23', spins: 252 },
  { date: '2024-05-24', spins: 294 },
  { date: '2024-05-25', spins: 201 },
  { date: '2024-05-26', spins: 213 },
  { date: '2024-05-27', spins: 420 },
  { date: '2024-05-28', spins: 233 },
  { date: '2024-05-29', spins: 78 },
  { date: '2024-05-30', spins: 340 },
  { date: '2024-05-31', spins: 178 },
  { date: '2024-06-01', spins: 178 },
  { date: '2024-06-02', spins: 470 },
  { date: '2024-06-03', spins: 103 },
  { date: '2024-06-04', spins: 439 },
  { date: '2024-06-05', spins: 88 },
  { date: '2024-06-06', spins: 294 },
  { date: '2024-06-07', spins: 323 },
  { date: '2024-06-08', spins: 385 },
  { date: '2024-06-09', spins: 438 },
  { date: '2024-06-10', spins: 155 },
  { date: '2024-06-11', spins: 92 },
  { date: '2024-06-12', spins: 492 },
  { date: '2024-06-13', spins: 81 },
  { date: '2024-06-14', spins: 426 },
  { date: '2024-06-15', spins: 307 },
  { date: '2024-06-16', spins: 371 },
  { date: '2024-06-17', spins: 475 },
  { date: '2024-06-18', spins: 107 },
  { date: '2024-06-19', spins: 341 },
  { date: '2024-06-20', spins: 408 },
  { date: '2024-06-21', spins: 169 },
  { date: '2024-06-22', spins: 317 },
  { date: '2024-06-23', spins: 480 },
  { date: '2024-06-24', spins: 132 },
  { date: '2024-06-25', spins: 141 },
  { date: '2024-06-26', spins: 434 },
  { date: '2024-06-27', spins: 448 },
  { date: '2024-06-28', spins: 149 },
  { date: '2024-06-29', spins: 103 },
  { date: '2024-06-30', spins: 446 },
]

const primaryColor = 'oklch(0.62 0.19 252)'

type DateRangeType = '7d' | '15d' | '30d' | '60d' | '90d' | 'custom'

export function CarkChart() {
  const [dateRangeType, setDateRangeType] = React.useState<DateRangeType>('30d')
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)

  // Custom tarih range kontrolü
  const isCustomRange = dateRangeType === 'custom'

  // Veriyi filtrele
  const filteredData = React.useMemo(() => {
    if (isCustomRange && startDate && endDate) {
      return chartData.filter((item) => {
        const date = new Date(item.date)
        return date >= startDate && date <= endDate
      })
    }

    const referenceDate = new Date('2024-06-30')
    let daysToSubtract = 30
    if (dateRangeType === '7d') daysToSubtract = 7
    else if (dateRangeType === '15d') daysToSubtract = 15
    else if (dateRangeType === '60d') daysToSubtract = 60
    else if (dateRangeType === '90d') daysToSubtract = 90

    const start = new Date(referenceDate)
    start.setDate(start.getDate() - daysToSubtract)
    return chartData.filter((item) => {
      const date = new Date(item.date)
      return date >= start
    })
  }, [dateRangeType, startDate, endDate, isCustomRange])

  // Toplam ve ortalama hesapla
  const totalSpins = React.useMemo(() => filteredData.reduce((sum, item) => sum + item.spins, 0), [filteredData])
  const avgSpins = React.useMemo(() => Math.round(totalSpins / filteredData.length), [filteredData, totalSpins])
  const maxSpins = React.useMemo(() => Math.max(...filteredData.map(d => d.spins)), [filteredData])

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
                      setDateRangeType('30d')
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
      </CardContent>
    </Card>
  )
}
