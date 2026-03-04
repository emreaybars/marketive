'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Prize {
  id: string
  name: string
  color: string
  chance: number
  description?: string
}

interface WheelPreviewProps {
  prizes: Prize[]
  size?: number
  className?: string
  showOuterRing?: boolean
  rotation?: number
  spinning?: boolean
}

export function WheelPreview({
  prizes,
  size = 200,
  className,
  showOuterRing = true,
  rotation = 0,
  spinning = false
}: WheelPreviewProps) {
  const centerX = 50
  const centerY = 50
  const radius = 45

  const { svgContent, totalRotation } = useMemo(() => {
    if (!prizes || prizes.length === 0) {
      return { svgContent: '', totalRotation: 0 }
    }

    const anglePerPrize = 360 / prizes.length
    let content = ''

    prizes.forEach((prize, index) => {
      const startAngle = index * anglePerPrize
      const endAngle = (index + 1) * anglePerPrize
      const startRad = (startAngle - 90) * Math.PI / 180
      const endRad = (endAngle - 90) * Math.PI / 180

      const x1 = centerX + radius * Math.cos(startRad)
      const y1 = centerY + radius * Math.sin(startRad)
      const x2 = centerX + radius * Math.cos(endRad)
      const y2 = centerY + radius * Math.sin(endRad)

      // Dilim yolu
      const pathData = `
        M ${centerX},${centerY}
        L ${x1},${y1}
        A ${radius},${radius} 0 0,1 ${x2},${y2}
        Z
      `

      // Metin pozisyonu
      const textRadius = radius * 0.65
      const textAngle = startAngle + anglePerPrize / 2
      const textRad = (textAngle - 90) * Math.PI / 180
      const textX = centerX + textRadius * Math.cos(textRad)
      const textY = centerY + textRadius * Math.sin(textRad)

      content += `
        <path
          d="${pathData}"
          fill="${prize.color || '#ff0000'}"
          stroke="white"
          stroke-width="0.3"
        />
        <text
          x="${textX}"
          y="${textY}"
          fill="white"
          font-size="3"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${textAngle - 90}, ${textX}, ${textY})"
          style="text-transform: uppercase; font-weight: 700;"
        >
          ${prize.name.substring(0, 12)}${prize.name.length > 12 ? '...' : ''}
        </text>
      `
    })

    return { svgContent: content, totalRotation: rotation }
  }, [prizes, rotation])

  if (!prizes || prizes.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-slate-400">Ödül yok</span>
      </div>
    )
  }

  return (
    <div
      className={cn("relative", className)}
      style={{
        width: size,
        height: size
      }}
    >
      {/* Outer ring decoration */}
      {showOuterRing && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'url(https://carkifelek.io/cark-circle.png) center/cover',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
        />
      )}

      {/* Wheel SVG */}
      <svg
        viewBox="0 0 100 100"
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          padding: size * 0.04,
          transform: `rotate(${totalRotation}deg)`,
          transition: spinning ? 'transform 5s cubic-bezier(.17,.67,.12,.99)' : 'none',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
          </filter>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: svgContent }} />
      </svg>

      {/* Center circle */}
      <div
        className="absolute rounded-full bg-white flex items-center justify-center"
        style={{
          width: size * 0.15,
          height: size * 0.15,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 18px 4px rgba(0, 0, 0, 0.17)',
          zIndex: 10
        }}
      >
        <div
          className="rounded-full bg-slate-100"
          style={{
            width: '70%',
            height: '70%',
            boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.2)'
          }}
        />
      </div>

      {/* Marker/Arrow */}
      <div
        className="absolute left-1/2 flex items-center justify-center"
        style={{
          top: -size * 0.02,
          transform: 'translateX(-50%)',
          zIndex: 20,
          width: size * 0.12,
          height: size * 0.12
        }}
      >
        <div
          className="w-full h-full bg-white rounded-sm"
          style={{
            borderRadius: '0 50% 50% 50%',
            transform: 'rotate(-135deg)',
            boxShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.23)'
          }}
        >
          <svg
            viewBox="0 0 12 12"
            className="w-full h-full"
            style={{
              transform: 'rotate(135deg)'
            }}
          >
            <polygon
              points="7.489 4.667 6 0 4.511 4.667 0 4.667 3.59 7.416 2.101 12 6 9.167 9.899 12 8.41 7.416 12 4.667 7.489 4.667"
              fill="#ffce01"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

// Full wheel widget preview - matches the widget design exactly
interface WheelWidgetPreviewProps {
  prizes: Prize[]
  title?: string
  description?: string
  buttonText?: string
  backgroundColor?: string
  buttonColor?: string
  logoUrl?: string
  size?: number
  showEmailForm?: boolean
}

export function WheelWidgetPreview({
  prizes,
  title = 'Çarkı Çevir Hediyeni Kazan!',
  description = 'Hediyeni almak için hemen çarkı çevir.',
  buttonText = 'ÇARKI ÇEVİR',
  backgroundColor = 'rgba(139, 0, 0, 0.9)',
  buttonColor = '#d10000',
  logoUrl,
  size = 280,
  showEmailForm = false
}: WheelWidgetPreviewProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: backgroundColor,
        width: '100%',
        maxWidth: 400
      }}
    >
      {/* Content Container */}
      <div className="flex flex-col items-center p-6 relative z-10">
        {/* Logo */}
        {logoUrl && (
          <div className="mb-4">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-12 max-w-[120px] object-contain"
            />
          </div>
        )}

        {/* Info */}
        <div className="text-center mb-4 w-full">
          <p className="text-white text-xl font-bold uppercase tracking-wide leading-tight mb-2">
            {title}
          </p>
          <p className="text-white/80 text-sm">
            {description}
          </p>
        </div>

        {/* Email Form Preview */}
        {showEmailForm && (
          <div className="w-full max-w-[280px] mb-4">
            <div className="relative">
              <input
                type="email"
                placeholder="E-mail adresiniz yazın"
                className="w-full py-3 px-4 pl-12 rounded-lg bg-white border-2 border-gray-200 text-sm text-gray-700"
                readOnly
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Spin Button */}
        <button
          className="relative overflow-hidden w-full max-w-[280px] py-3 px-4 rounded-[22px] font-semibold text-white text-sm mb-4"
          style={{
            backgroundColor: buttonColor,
            boxShadow: '1px 5px 0px rgba(0, 0, 0, 0.22)'
          }}
        >
          {/* Shine animation */}
          <span
            className="absolute top-0 left-0 w-1/2 h-full"
            style={{
              background: 'linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.45), transparent)',
              transform: 'skewX(-20deg)',
              animation: 'spin-shine 3.5s ease-in-out infinite'
            }}
          />
          <span className="relative">{buttonText}</span>
        </button>

        {/* Wheel */}
        <WheelPreview
          prizes={prizes}
          size={size}
          showOuterRing={true}
        />
      </div>

      {/* Shine animation style */}
      <style>{`
        @keyframes spin-shine {
          0% {
            left: -120%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          30% {
            left: 120%;
            opacity: 0;
          }
          100% {
            left: 120%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
