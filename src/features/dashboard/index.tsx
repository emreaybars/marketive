import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Dices, MessageCircle, ShoppingCart, Check, X, TrendingUp, Zap, Shield, Users, Clock, Star, Award, BarChart3, Users2, Sparkles, ArrowRight } from 'lucide-react'

export const marketingServices = [
  {
    id: 'wheel-of-fortune',
    name: 'Çarkıfelek',
    description: 'Müşterilerinize eğlenceli çarkıfelek oyunu sunun, kazançlar ve indirimler sağlayın.',
    shortDesc: 'Eğlenceli çark oyunu ile müşteri etkileşimi artırın',
    icon: Dices,
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    popular: true,
    features: [
      'Sınırsız kampanya',
      'Otomatik akışlar',
      'Sepet terk recovery',
      'Müşteri segmentasyonu',
      'Gerçek zamanlı analitik',
      'Entegrasyon desteği'
    ],
    detailedFeatures: [
      { icon: Zap, title: 'Hızlı Kurulum', description: '5 dakikada çarkınızı oluşturun ve yayına alın', highlight: true },
      { icon: Users, title: 'Kullanıcı Dostu', description: 'Müşterileriniz kolayca çarkı çevirebilir' },
      { icon: Shield, title: 'Güvenli Ödeme', description: 'SSL sertifikalı güvenli işlem altyapısı' },
      { icon: TrendingUp, title: 'Analitik Raporlama', description: 'Detaylı performans ve dönüşüm raporları' },
      { icon: Clock, title: '7/24 Destek', description: 'Uzman ekibimiz her zaman yanınızda' },
      { icon: Star, title: 'Ödül Havuzu', description: 'Sınırsız ödül seçeneği ile esnek kampanyalar' },
    ],
    benefits: [
      'Satışları %30 artırın',
      'Müşteri sadakatini güçlendirin',
      'Viral etki yaratın',
      'Otomatik pazarlama'
    ],
    pricing: {
      monthly: 499,
      yearly: 4990,
    },
    stats: {
      users: '10.000+',
      rating: 4.9,
      reviews: 256
    }
  },
  {
    id: 'whatsapp-marketing',
    name: 'WhatsApp Marketing',
    description: 'WhatsApp üzerinden müşterilerinizle etkileşim kurun, otomatik mesajlar gönderin.',
    shortDesc: 'WhatsApp Business API ile toplu mesaj gönderimi',
    icon: MessageCircle,
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    popular: true,
    features: [
      'Sınırsız kampanya',
      'Otomatik akışlar',
      'Terk edilmiş sepet kurtarma',
      'Müşteri segmentasyonu',
      'Gerçek zamanlı analitik',
      'Klaviyo entegrasyonu'
    ],
    detailedFeatures: [
      { icon: Zap, title: 'Anında Teslimat', description: 'Mesajlarınız saniyeler içinde ulaşır', highlight: true },
      { icon: Users2, title: 'Hedef Kitle', description: 'Müşterilerinizi segmentlere ayırın, kişiselleştirilmiş mesajlar gönderin' },
      { icon: Shield, title: 'WhatsApp Business API', description: 'Resmi API entegrasyonu ile güvenli iletişim' },
      { icon: TrendingUp, title: 'Detaylı Raporlar', description: 'Açılma ve tıklama oranlarını takip edin' },
      { icon: BarChart3, title: 'Chatbot Entegrasyonu', description: 'AI destekli otomatik yanıt sistemi' },
      { icon: Clock, title: '7/24 Operasyon', description: 'Gün boyu mesaj gönderimi ve takibi' },
    ],
    benefits: [
      'Açılma oranı %98',
      'Müşteri memnuniyeti artışı',
      'Otomasyon ile zaman tasarrufu',
      'Kişiselleştirilebilir kampanyalar'
    ],
    pricing: {
      monthly: 799,
      yearly: 7990,
    },
    stats: {
      users: '25.000+',
      rating: 4.8,
      reviews: 189
    }
  },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedService, setSelectedService] = useState<typeof marketingServices[0] | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleBillingToggle = (checked: boolean) => {
    setIsAnimating(true)
    setBillingPeriod(checked ? 'yearly' : 'monthly')
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handlePurchase = (serviceId: string) => {
    navigate({
      to: '/checkout',
      search: { serviceId, billingPeriod }
    })
  }

  const calculateSavings = (service: typeof marketingServices[0]) => {
    const monthlyTotal = service.pricing.monthly * 12
    const savings = monthlyTotal - service.pricing.yearly
    const savingsPercent = Math.round((savings / monthlyTotal) * 100)
    return { amount: savings, percent: savingsPercent }
  }

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='overflow-y-auto'>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Panel
          </h1>
          <p className='text-muted-foreground'>
            Marketing hizmetlerimizi keşfedin ve işinizi büyütün
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className='flex items-center justify-center gap-3 py-8'>
          <button
            onClick={() => handleBillingToggle(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              billingPeriod === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Aylık
          </button>
          <button
            onClick={() => handleBillingToggle(true)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              billingPeriod === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Yıllık
            <span className='ml-1.5 inline-block bg-blue-400 p-1 rounded-md text-white'>
              %17
            </span>
          </button>
        </div>

        {/* Marketing Services Grid */}
        <div className='grid gap-8 md:grid-cols-2 max-w-5xl mx-auto'>
          {marketingServices.map((service) => {
            const price = billingPeriod === 'monthly'
              ? service.pricing.monthly
              : service.pricing.yearly
            const monthlyPrice = billingPeriod === 'yearly'
              ? Math.round(service.pricing.yearly / 12)
              : service.pricing.monthly
            const savings = calculateSavings(service)

            return (
              <div
                key={service.id}
                className='group relative bg-card rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 border dark:border-border'
                style={{
                  boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.06), 0 2px 8px -1px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Card Header */}
                <div className='p-6 md:p-8 pb-4 md:pb-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3 md:gap-4'>
                      <div className={`flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-lg md:rounded-2xl bg-gradient-to-br ${service.gradientFrom} ${service.gradientTo}`}>
                        <service.icon className='h-5 w-5 md:h-7 md:w-7 text-white' />
                      </div>
                      <div>
                        <h3 className='text-lg md:text-xl font-semibold tracking-tight'>{service.name}</h3>
                        <p className='text-xs md:text-sm text-muted-foreground mt-1'>{service.shortDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Highlight Area */}
                <div className='px-8 pb-6'>
                  <div className='relative overflow-hidden rounded-2xl p-6 text-foreground bg-muted/50 dark:bg-muted/20'>
                    <div className='relative'>
                      <div className={`flex items-baseline gap-2 transition-all duration-300 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
                        <span className='text-3xl font-bold tracking-tight'>₺{price.toLocaleString('tr-TR')}</span>
                        <span className='text-sm text-muted-foreground'>/ {billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'}</span>
                      </div>
                      <p className='text-muted-foreground mt-2 text-sm'>
                        {billingPeriod === 'monthly' ? '' : `≈ ₺${monthlyPrice.toLocaleString('tr-TR')}/ay (yıllık)`}
                      </p>
                      {billingPeriod === 'yearly' && (
                        <div className='mt-3 inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary'>
                          <Sparkles className='h-3 w-3' />
                          ₺{savings.amount.toLocaleString('tr-TR')} tasarruf
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className='px-8 pb-8'>
                  <ul className='space-y-3'>
                    {service.features.map((feature, index) => (
                      <li key={index} className='flex items-center gap-3 text-sm'>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${service.gradientFrom} ${service.gradientTo} flex items-center justify-center`}>
                          <Check className='h-3 w-3 text-white' strokeWidth={3} />
                        </div>
                        <span className='text-muted-foreground'>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className='px-8 pb-6'>
                  <div className='flex items-center gap-6 py-3 border-y border-border/50'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm font-medium'>{service.stats.users}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                      <span className='text-sm font-medium'>{service.stats.rating}</span>
                      <span className='text-xs text-muted-foreground'>({service.stats.reviews} yorum)</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className='p-8 pt-0 space-y-3'>
                  <Button
                    className={`w-full h-12 rounded-xl text-base font-semibold text-white bg-gradient-to-r ${service.gradientFrom} ${service.gradientTo} hover:opacity-90 dark:from-blue-600 dark:to-blue-700 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group/btn`}
                    onClick={() => handlePurchase(service.id)}
                  >
                    Satın Al
                    <ArrowRight className='ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1' />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Main>

      {/* Enhanced Service Details Dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-3xl touch-pan-y' style={{ WebkitOverflowScrolling: 'touch' }}>
          {selectedService && (
            <>
              {/* Header with Gradient Background */}
              <div className={`relative bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo} p-6 md:p-10 text-white shrink-0`}>
                {/* Close Button */}
                <button
                  onClick={() => setSelectedService(null)}
                  className='absolute top-4 right-4 md:top-5 md:right-5 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10'
                >
                  <X className='h-5 w-5' />
                </button>

                <div className='flex flex-col md:flex-row md:items-start gap-4 md:gap-8'>
                  <div className='flex h-16 w-16 md:h-24 md:w-24 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-xl'>
                    <selectedService.icon className='h-8 w-8 md:h-12 md:w-12' />
                  </div>
                  <div className='flex-1 pt-1'>
                    <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2'>
                      <DialogTitle className='text-2xl md:text-4xl font-bold tracking-tight'>
                        {selectedService.name}
                      </DialogTitle>
                      <Badge className='bg-white/20 text-white border-white/30 w-fit text-xs'>
                        Popular
                      </Badge>
                    </div>
                    <DialogDescription className='text-white/90 text-base md:text-lg max-w-2xl'>
                      {selectedService.description}
                    </DialogDescription>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className='flex flex-wrap items-center gap-3 md:gap-8 mt-6 pt-4 md:pt-6 border-t border-white/20'>
                  <div className='flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5'>
                    <Users className='h-4 w-4 md:h-5 md:w-5' />
                    <span className='font-semibold text-sm md:text-base'>{selectedService.stats.users}</span>
                    <span className='text-white/70 text-xs md:text-sm'>aktif kullanıcı</span>
                  </div>
                  <div className='flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5'>
                    <Star className='h-4 w-4 md:h-5 md:w-5 fill-yellow-300 text-yellow-300' />
                    <span className='font-semibold text-sm md:text-base'>{selectedService.stats.rating}</span>
                    <span className='text-white/70 text-xs md:text-sm'>({selectedService.stats.reviews} yorum)</span>
                  </div>
                </div>
              </div>

              <div className='p-6 md:p-10 space-y-8 md:space-y-10 bg-card'>
                {/* Benefits Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo} shrink-0`}>
                      <Award className='h-5 w-5 text-white' />
                    </div>
                    <h3 className='text-xl md:text-2xl font-bold'>Size Neler Kazanacaksınız?</h3>
                  </div>
                  <div className='grid gap-3 md:gap-4 sm:grid-cols-2'>
                    {selectedService.benefits.map((benefit, index) => (
                      <div key={index} className='flex items-center gap-3 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors'>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo}`}>
                          <Check className='h-5 w-5 text-white' strokeWidth={3} />
                        </div>
                        <span className='font-medium text-sm md:text-base'>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className='bg-border/50' />

                {/* Detailed Features Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo} shrink-0`}>
                      <Star className='h-5 w-5 text-white' />
                    </div>
                    <h3 className='text-xl md:text-2xl font-bold'>Hizmet Özellikleri</h3>
                  </div>
                  <div className='grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {selectedService.detailedFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 md:gap-4 p-4 md:p-5 rounded-xl border transition-colors ${
                          feature.highlight
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo}`}>
                          <feature.icon className='h-6 w-6 text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-semibold text-sm md:text-base mb-1'>{feature.title}</h4>
                          <p className='text-xs md:text-sm text-muted-foreground line-clamp-2'>{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className='bg-border/50' />

                {/* Pricing Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo} shrink-0`}>
                      <BarChart3 className='h-5 w-5 text-white' />
                    </div>
                    <h3 className='text-xl md:text-2xl font-bold'>Fiyatlandırma</h3>
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div
                      className={`relative p-5 md:p-6 rounded-xl border-2 transition-all cursor-pointer bg-muted/50 dark:bg-muted/20 ${
                        billingPeriod === 'monthly'
                          ? 'border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => billingPeriod !== 'monthly' && handleBillingToggle(false)}
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <span className='font-bold text-sm md:text-base'>Aylık Plan</span>
                        {billingPeriod === 'monthly' && (
                          <Badge className='bg-primary text-primary-foreground text-xs'>Seçili</Badge>
                        )}
                      </div>
                      <div className='flex items-baseline gap-1 md:gap-2 mb-2'>
                        <span className='text-3xl md:text-5xl font-bold'>₺{selectedService.pricing.monthly.toLocaleString('tr-TR')}</span>
                        <span className='text-sm md:text-lg text-muted-foreground'>/ay</span>
                      </div>
                      <p className='text-xs md:text-sm text-muted-foreground'>Esnek, aylık ödeme seçeneği</p>
                    </div>

                    <div
                      className={`relative p-5 md:p-6 rounded-xl border-2 transition-all cursor-pointer bg-muted/50 dark:bg-muted/20 ${
                        billingPeriod === 'yearly'
                          ? 'border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => billingPeriod !== 'yearly' && handleBillingToggle(true)}
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <span className='font-bold text-sm md:text-base'>Yıllık Plan</span>
                        <Badge className={`bg-gradient-to-r ${selectedService.gradientFrom} ${selectedService.gradientTo} text-white border-0 text-xs dark:text-black`}>
                          %17 indirim
                        </Badge>
                      </div>
                      <div className='flex items-baseline gap-1 md:gap-2 mb-2'>
                        <span className='text-3xl md:text-5xl font-bold'>₺{selectedService.pricing.yearly.toLocaleString('tr-TR')}</span>
                        <span className='text-sm md:text-lg text-muted-foreground'>/yıl</span>
                      </div>
                      <p className='text-xs md:text-sm text-muted-foreground'>≈ ₺{Math.round(selectedService.pricing.yearly / 12).toLocaleString('tr-TR')}/ay</p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className='flex flex-col sm:flex-row gap-3 pt-2'>
                  <Button
                    variant='outline'
                    className='flex-1 h-12 rounded-xl text-base font-semibold border-2 hover:bg-muted'
                    onClick={() => setSelectedService(null)}
                  >
                    İptal
                  </Button>
                  <Button
                    className='flex-1 h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25'
                    onClick={() => handlePurchase(selectedService.id)}
                  >
                    <ShoppingCart className='mr-2 h-5 w-5' />
                    Hemen Satın Al
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
