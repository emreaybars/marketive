'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface Prize {
  id: string
  name: string
  color: string
  chance: number
}

interface SpinToWinPopupProps {
  isOpen: boolean
  onClose: () => void
  prizes: Prize[]
  title?: string
  description?: string
  contactType: 'email' | 'phone'
  buttonText?: string
  buttonColor?: string
  backgroundColor?: string
  onSubmit?: (data: { fullName: string; email?: string; phone?: string; consents: string[] }) => void
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#1a1a1a' : '#ffffff'
}

function lightenColor(hexColor: string, amount: number): string {
  const hex = hexColor.replace('#', '')
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount)
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount)
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SpinToWinPopup({
  isOpen,
  onClose,
  prizes,
  title = 'Şansını Deneme! 🎁',
  description = 'Çarkı çevir, arma kazan!',
  contactType = 'email',
  buttonText = 'Çevir Kazan',
  buttonColor = '#25D366',
  backgroundColor = '#25D366',
  onSubmit
}: SpinToWinPopupProps) {

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [consents, setConsents] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Draw wheel on mount and when prizes change
  useEffect(() => {
    if (isOpen && canvasRef.current && prizes.length > 0) {
      drawWheel()
    }
  }, [isOpen, prizes])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ============================================
  // WHEEL DRAWING
  // ============================================

  function drawWheel() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 24

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height)

    const numSlices = prizes.length
    const sliceAngle = (2 * Math.PI) / numSlices

    // Draw outer dots (decorative)
    const dotCount = 48
    const dotRadius = radius + 14
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * 2 * Math.PI
      const x = centerX + Math.cos(angle) * dotRadius
      const y = centerY + Math.sin(angle) * dotRadius

      ctx.beginPath()
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
    }

    // Draw slices
    prizes.forEach((prize, index) => {
      const startAngle = index * sliceAngle - Math.PI / 2
      const endAngle = startAngle + sliceAngle - 0.04

      // Slice path
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // Gradient fill
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, lightenColor(prize.color, 40))
      gradient.addColorStop(0.5, prize.color)
      gradient.addColorStop(1, prize.color)
      ctx.fillStyle = gradient
      ctx.fill()

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw prize name (radially aligned)
      drawRadialText(ctx, prize.name, startAngle, endAngle, centerX, centerY, radius * 0.72, prize.color)
    })

    // Inner dashed circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.35, 0, 2 * Math.PI)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.stroke()
    ctx.setLineDash([])

    // Center white circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 42, 0, 2 * Math.PI)
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 42)
    centerGradient.addColorStop(0, '#ffffff')
    centerGradient.addColorStop(1, '#f0f0f0')
    ctx.fillStyle = centerGradient
    ctx.fill()

    // Center shadow
    ctx.shadowColor = 'rgba(0,0,0,0.1)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2

    // Center icon placeholder
    ctx.fillStyle = '#25D366'
    ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎁', centerX, centerY)

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  function drawRadialText(
    ctx: CanvasRenderingContext2D,
    text: string,
    startAngle: number,
    endAngle: number,
    centerX: number,
    centerY: number,
    textRadius: number,
    prizeColor: string
  ) {
    const midAngle = startAngle + (endAngle - startAngle) / 2
    const textX = centerX + Math.cos(midAngle) * textRadius
    const textY = centerY + Math.sin(midAngle) * textRadius

    ctx.save()
    ctx.translate(textX, textY)
    ctx.rotate(midAngle + Math.PI / 2)

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1

    ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = getContrastColor(prizeColor)

    // Truncate long text
    const maxLength = 14
    const displayText = text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text

    ctx.fillText(displayText, 0, 0)
    ctx.restore()
  }

  // ============================================
  // FORM HANDLERS
  // ============================================

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Lütfen adınızı ve soyadınızı girin'
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Ad soyad en az 3 karakter olmalı'
    }

    if (contactType === 'email') {
      if (!email.trim()) {
        newErrors.email = 'Lütfen e-posta adresinizi girin'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Geçerli bir e-posta adresi girin'
      }
    } else {
      if (!phone.trim()) {
        newErrors.phone = 'Lütfen telefon numaranızı girin'
      } else if (!/^(\+?90|0)?5\d{9}$/.test(phone.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/-/g, ''))) {
        newErrors.phone = 'Geçerli bir telefon numarası girin (5XX XXX XX XX)'
      }
    }

    if (!consents.includes('eticaret')) {
      newErrors.consents = 'Elektronik ileti onayı gereklidir'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      if (onSubmit) {
        onSubmit({
          fullName: fullName.trim(),
          email: contactType === 'email' ? email.trim() : undefined,
          phone: contactType === 'phone' ? phone.trim() : undefined,
          consents
        })
      }
      setIsSubmitting(false)
    }, 1500)
  }

  const toggleConsent = (consent: string) => {
    setConsents(prev =>
      prev.includes(consent)
        ? prev.filter(c => c !== consent)
        : [...prev, consent]
    )
    if (errors.consents) {
      setErrors(prev => ({ ...prev, consents: '' }))
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-6 px-6">
          <h2
            className="text-3xl font-black mb-2"
            style={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px'
            }}
          >
            {title}
          </h2>
          <p className="text-neutral-600 font-medium">
            {description}
          </p>
        </div>

        {/* Wheel Section */}
        <div className="flex justify-center px-6 pb-6">
          <div className="relative">
            {/* Glow effect behind wheel */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ background: `radial-gradient(circle, ${backgroundColor}40, transparent 70%)` }}
            />

            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="relative z-0"
              style={{ maxHeight: '300px' }}
            />
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          {/* Full Name Input */}
          <div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }))
              }}
              placeholder="Ad Soyad"
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium outline-none ${
                errors.fullName
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:bg-red-100'
                  : 'border-neutral-200 bg-neutral-50 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10'
              }`}
              style={{ fontSize: '15px' }}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4m0 4h.01"/>
                </svg>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email or Phone Input */}
          <div>
            {contactType === 'email' ? (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                  }}
                  placeholder="E-posta adresiniz"
                  className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium outline-none ${
                    errors.email
                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:bg-red-100'
                      : 'border-neutral-200 bg-neutral-50 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10'
                  }`}
                  style={{ fontSize: '15px' }}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4m0 4h.01"/>
                    </svg>
                    {errors.email}
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
                  }}
                  placeholder="Telefon numaranız (5XX XXX XX XX)"
                  className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium outline-none ${
                    errors.phone
                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:bg-red-100'
                      : 'border-neutral-200 bg-neutral-50 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10'
                  }`}
                  style={{ fontSize: '15px' }}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4m0 4h.01"/>
                    </svg>
                    {errors.phone}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Consents */}
          <div className="space-y-3">
            {/* KVKK Checkbox */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                errors.consents
                  ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-green-200'
              }`}
              onClick={() => toggleConsent('kvvk')}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                  consents.includes('kvvk')
                    ? 'bg-green-500 border-green-500'
                    : 'border-neutral-300 hover:border-green-400'
                }`}
              >
                {consents.includes('kvvk') && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5}>
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </div>
              <span className="text-xs text-neutral-700 leading-snug">
                <span className="font-semibold">KVKK</span> bilgilendirme metnini okudum, kabul ediyorum
              </span>
            </label>

            {/* Electronic Communication Checkbox */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                errors.consents
                  ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-green-200'
              }`}
              onClick={() => toggleConsent('eticaret')}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                  consents.includes('eticaret')
                    ? 'bg-green-500 border-green-500'
                    : 'border-neutral-300 hover:border-green-400'
                }`}
              >
                {consents.includes('eticaret') && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5}>
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </div>
              <span className="text-xs text-neutral-700 leading-snug">
                <span className="font-semibold">Elektronik Ticari İleti</span> aydınlatma metnini okudum, kabul ediyorum
              </span>
            </label>

            {errors.consents && (
              <p className="text-xs font-semibold text-red-600 ml-1 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4m0 4h.01"/>
                </svg>
                {errors.consents}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group"
            style={{
              background: buttonColor || '#25D366',
              boxShadow: `0 8px 24px -4px ${buttonColor}66, 0 0 0 0 transparent`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 12px 32px -4px ${buttonColor}66`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = `0 8px 24px -4px ${buttonColor}66`
            }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2v4m0 12v4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.25}/>
                  <path d="M12 2v4m0 12v4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={3} strokeDasharray={32} strokeDashoffset={32} className="opacity-100"/>
                </svg>
                <span>İşleniyor...</span>
              </>
            ) : (
              <>
                <span className="font-bold tracking-wide" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
                  {buttonText}
                </span>
                <ChevronRight
                  size={18}
                  strokeWidth={3}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </>
            )}
          </button>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={buttonColor} strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span className="text-xs text-neutral-500 font-medium">
              Verileriniz güvende
            </span>
          </div>
        </form>

        {/* Bottom Accent */}
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(90deg, ${buttonColor}66, ${buttonColor}, ${buttonColor}66)`
          }}
        />
      </div>
    </div>
  )
}

// ============================================
// EXPORT TYPES
// ============================================

export type { Prize, SpinToWinPopupProps }
