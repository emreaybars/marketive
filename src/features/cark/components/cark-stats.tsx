'use client'

import { Badge } from '@/components/ui/badge'
import { TrendingUp, Mail, Phone, TurkishLira, Sparkles, ArrowUp, ArrowDown, Activity } from 'lucide-react'
import { useCark } from './cark-provider'
import { useEffect, useRef, useState } from 'react'

// Sayı animasyonu component'i
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const previousValue = useRef(0)

  useEffect(() => {
    if (!hasAnimated) {
      previousValue.current = 0
      setHasAnimated(true)
    }

    const duration = 1500 // 1.5 saniye
    const steps = 60
    const stepDuration = duration / steps
    const increment = (value - previousValue.current) / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const newValue = previousValue.current + (increment * currentStep)

      if (currentStep >= steps) {
        setDisplayValue(value)
        previousValue.current = value
        clearInterval(timer)
      } else {
        setDisplayValue(newValue)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value, hasAnimated])

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  )
}

export function CarkStats() {
  const { analytics, loading, initialLoadDone } = useCark()

  // Veriler yüklenmemişse veya ilk yükleme bitmediyse skeleton göster
  if (loading || !initialLoadDone || !analytics) {
    return (
      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]'>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
          <div className="p-6 space-y-4">
            <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
            <div className="h-9 w-24 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        {[2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-6 space-y-4">
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-8 w-20 bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-50 dark:bg-slate-800/30 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    {
      title: 'Ek Ciro',
      value: analytics.totalRevenue,
      prefix: '₺',
      decimals: 2,
      change: 0,
      icon: TurkishLira,
      description: 'Çarkıfelek ile kazandığınız toplam ek gelir',
      featured: true,
    },
    {
      title: 'Günlük Çevirme',
      value: analytics.todaySpins,
      decimals: 0,
      change: analytics.changeFromLastWeek || 0,
      icon: TrendingUp,
      description: 'Toplam çark çevirme sayısı.',
    },
    {
      title: 'Toplam E-posta',
      value: analytics.totalEmails,
      decimals: 0,
      change: 0,
      icon: Mail,
      description: 'Toplam e-posta sayısı.',
    },
    {
      title: 'Toplam Telefon',
      value: analytics.totalPhones,
      decimals: 0,
      change: 0,
      icon: Phone,
      description: 'Toplam telefon sayısı.',
    },
  ]

  return (
    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]'>
      {stats.map((stat, index) => (
        <div
          key={stat.title}
          className="group relative h-full"
          style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
        >
          <div
            className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${stat.featured
              ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-500 dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-600 shadow-md hover:shadow-lg'
              : 'bg-white dark:bg-card border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700'
              } transition-all duration-300`}
            style={
              stat.featured
                ? {
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 4s ease infinite',
                }
                : undefined
            }
          >
            {/* Live indicator for non-featured cards */}
            {!stat.featured && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            )}

            {/* Featured badge */}
            {stat.featured && (
              <div className="absolute top-4 right-4">
                <Badge className="gap-1 bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-xs">Öne Çıkan</span>
                </Badge>
              </div>
            )}

            <div className="flex flex-1 flex-col p-6">
              {/* Header with icon and title */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`absolute inset-0 ${stat.featured ? 'bg-white/20 blur-xl' : 'bg-emerald-500/10 blur-xl'}`} />
                    <div className={`relative ${stat.featured ? 'w-14 h-14' : 'w-12 h-12'} rounded-xl ${stat.featured
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
                      } flex items-center justify-center`}>
                      <stat.icon className={`${stat.featured ? 'h-7 w-7' : 'h-5 w-5'} ${stat.featured ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${stat.featured ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{stat.title}</h3>
                    <p className={`text-xs mt-0.5 ${stat.featured ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>Gerçek zamanlı veri</p>
                  </div>
                </div>
              </div>

              {/* Value section */}
              <div className="flex flex-1 flex-col justify-between space-y-3">
                <div className="flex items-baseline gap-3">
                  <p className={`font-bold ${stat.featured ? 'text-4xl text-white' : 'text-3xl text-slate-900 dark:text-slate-100'}`}>
                    <AnimatedNumber
                      value={stat.value}
                      prefix={stat.prefix || ''}
                      decimals={stat.decimals}
                    />
                  </p>

                  {/* Change badge */}
                  {stat.change !== 0 && !stat.featured && (
                    <Badge
                      variant="outline"
                      className={`gap-1 ${stat.change >= 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                        } transition-all duration-300`}
                    >
                      {stat.change >= 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      <span className="font-semibold">{Math.abs(stat.change).toFixed(1)}%</span>
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div className={`flex items-center gap-2 ${stat.featured ? 'text-sm text-emerald-50' : 'text-sm text-slate-500 dark:text-slate-400'}`}>
                  {stat.featured ? (
                    <Sparkles className="h-4 w-4 text-white/80" />
                  ) : (
                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                  )}
                  <p>{stat.description}</p>
                </div>
              </div>

              {/* Bottom accent line with animation */}
              {!stat.featured && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              )}

              {/* Featured card gradient overlay */}
              {stat.featured && (
                <>
                  {/* Pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.09]"
                    style={{
                      backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                    }}
                  />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
