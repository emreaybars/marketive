import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ArrowLeft, ArrowRight, CreditCard, Building2, Landmark, Shield, Lock, Check, User, Building } from 'lucide-react'
import { marketingServices } from '@/features/dashboard'

const TAX_RATE = 0.20

type CheckoutStep = 'billing' | 'payment' | 'card' | 'review'

export function Checkout() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('billing')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'iyzico' | 'stripe'>('card')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    taxId: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  })

  // Get selected service from URL search params
  const searchParams = new URLSearchParams(window.location.search)
  const serviceId = searchParams.get('serviceId') || 'wheel-of-fortune'
  const billingPeriod = (searchParams.get('billingPeriod') || 'monthly') as 'monthly' | 'yearly'

  const selectedService = marketingServices.find(s => s.id === serviceId) || marketingServices[0]
  const price = billingPeriod === 'monthly' ? selectedService.pricing.monthly : selectedService.pricing.yearly
  const tax = Math.round(price * TAX_RATE)
  const total = price + tax

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) return
    console.log('Processing payment:', { serviceId, billingPeriod, total, paymentMethod, formData })
    // Navigate to success page or show success message
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isCardPayment = paymentMethod === 'card' || paymentMethod === 'stripe'

  const nextStep = () => {
    if (!canProceed()) return
    if (currentStep === 'billing') setCurrentStep('payment')
    else if (currentStep === 'payment') setCurrentStep(isCardPayment ? 'card' : 'review')
    else if (currentStep === 'card') setCurrentStep('review')
  }

  const prevStep = () => {
    if (currentStep === 'payment') setCurrentStep('billing')
    else if (currentStep === 'card') setCurrentStep('payment')
    else if (currentStep === 'review') setCurrentStep(isCardPayment ? 'card' : 'payment')
  }

  const canProceed = () => {
    if (currentStep === 'billing') {
      return formData.name && formData.email && formData.phone
    }
    if (currentStep === 'card') {
      return formData.cardNumber && formData.cardExpiry && formData.cardCvv
    }
    return true
  }

  const canGoToStep = (targetStep: CheckoutStep) => {
    const stepOrder: CheckoutStep[] = ['billing', 'payment', 'card', 'review']
    const currentIndex = stepOrder.indexOf(currentStep)
    const targetIndex = stepOrder.indexOf(targetStep)

    // Allow going back to any previous step
    if (targetIndex < currentIndex) return true

    // Prevent skipping steps
    if (targetIndex > currentIndex + 1) return false

    // Check if current step is valid before proceeding
    return canProceed()
  }

  const handleTabChange = (value: string) => {
    const targetStep = value as CheckoutStep
    if (canGoToStep(targetStep)) {
      setCurrentStep(targetStep)
    }
  }

  const steps = [
    { id: 'billing', title: 'Fatura', icon: User },
    { id: 'payment', title: 'Ödeme', icon: CreditCard },
    ...(isCardPayment ? [{ id: 'card', title: 'Kart', icon: Building2 }] : []),
    { id: 'review', title: 'Onay', icon: Check },
  ]

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-6'>
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0'
            onClick={() => navigate({ to: '/' })}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Ödeme</h1>
            <p className='text-muted-foreground'>Sipariş detaylarınızı tamamlayın</p>
          </div>
        </div>

        {/* Mobile Steps Progress */}
        <div className='md:hidden mb-6'>
          <div className='flex items-center justify-between px-2'>
            {steps.map((step, index) => {
              const isActive = step.id === currentStep
              const isPast = steps.findIndex(s => s.id === currentStep) > index
              return (
                <div key={step.id} className='flex flex-col items-center'>
                  <div className='flex items-center'>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 w-6 -mx-1 ${isPast ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                  <span key={`${step.id}-label`} className={`text-xs font-medium mt-2 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='grid gap-6 lg:grid-cols-3'>
            {/* Main Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Desktop Tab Header */}
              <div className='hidden md:block'>
                <Tabs value={currentStep} onValueChange={handleTabChange}>
                  <TabsList className='grid w-full grid-cols-4'>
                    {steps.map((step) => {
                      const isDisabled = !canGoToStep(step.id as CheckoutStep) && step.id !== currentStep
                      return (
                        <TabsTrigger
                          key={step.id}
                          value={step.id}
                          className='gap-2'
                          disabled={isDisabled}
                        >
                          <step.icon className='h-4 w-4' />
                          {step.title}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </Tabs>
              </div>

              {/* Step Content */}
              {currentStep === 'billing' && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Fatura Bilgileri</CardTitle>
                    <CardDescription>Fatura bilgilerinizi girin</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Ad Soyad *</Label>
                      <Input
                        id='name'
                        placeholder='Adınız Soyadınız'
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='email'>E-posta *</Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder='ornek@email.com'
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='phone'>Telefon *</Label>
                      <Input
                        id='phone'
                        type='tel'
                        placeholder='+90 555 123 45 67'
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='company'>Şirket (Opsiyonel)</Label>
                      <Input
                        id='company'
                        placeholder='Şirket adı'
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='taxId'>Vergi No (Opsiyonel)</Label>
                      <Input
                        id='taxId'
                        placeholder='Vergi numaranız'
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'payment' && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Ödeme Yöntemi</CardTitle>
                    <CardDescription>Size en uygun ödeme yöntemini seçin</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                      <div className='grid gap-3'>
                        <label
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'card'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <RadioGroupItem value='card' className='sr-only' />
                          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                            <CreditCard className='h-5 w-5 text-primary' />
                          </div>
                          <div className='flex-1'>
                            <span className='font-medium'>Kredi Kartı / Banka Kartı</span>
                            <p className='text-sm text-muted-foreground'>Visa, Mastercard, Amex</p>
                          </div>
                          {paymentMethod === 'card' && (
                            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary'>
                              <Check className='h-4 w-4 text-white' />
                            </div>
                          )}
                        </label>

                        <label
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'iyzico'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <RadioGroupItem value='iyzico' className='sr-only' />
                          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                            <Landmark className='h-5 w-5 text-primary' />
                          </div>
                          <div className='flex-1'>
                            <span className='font-medium'>iyzico ile Güvenli Ödeme</span>
                            <p className='text-sm text-muted-foreground'>3D Secure ile koruma</p>
                          </div>
                          {paymentMethod === 'iyzico' && (
                            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary'>
                              <Check className='h-4 w-4 text-white' />
                            </div>
                          )}
                        </label>

                        <label
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'stripe'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <RadioGroupItem value='stripe' className='sr-only' />
                          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                            <Building2 className='h-5 w-5 text-primary' />
                          </div>
                          <div className='flex-1'>
                            <span className='font-medium'>Stripe</span>
                            <p className='text-sm text-muted-foreground'>Uluslararası ödeme</p>
                          </div>
                          {paymentMethod === 'stripe' && (
                            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary'>
                              <Check className='h-4 w-4 text-white' />
                            </div>
                          )}
                        </label>

                        <label
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            paymentMethod === 'bank'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <RadioGroupItem value='bank' className='sr-only' />
                          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                            <Building className='h-5 w-5 text-primary' />
                          </div>
                          <div className='flex-1'>
                            <span className='font-medium'>Havale / EFT</span>
                            <p className='text-sm text-muted-foreground'>Banka transferi</p>
                          </div>
                          {paymentMethod === 'bank' && (
                            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary'>
                              <Check className='h-4 w-4 text-white' />
                            </div>
                          )}
                        </label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'card' && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Kart Bilgileri</CardTitle>
                    <CardDescription>Kart bilgilerinizi güvenli şekilde girin</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='cardNumber'>Kart Numarası *</Label>
                      <Input
                        id='cardNumber'
                        placeholder='1234 5678 9012 3456'
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        required
                        maxLength={19}
                      />
                    </div>

                    <div className='grid gap-4 sm:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='cardExpiry'>Son Kullanma *</Label>
                        <Input
                          id='cardExpiry'
                          placeholder='AA/YY'
                          value={formData.cardExpiry}
                          onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                          required
                          maxLength={5}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='cardCvv'>CVV/CVC *</Label>
                        <Input
                          id='cardCvv'
                          placeholder='123'
                          value={formData.cardCvv}
                          onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                          required
                          maxLength={4}
                          type='password'
                        />
                      </div>
                    </div>

                    <div className='flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3'>
                      <Lock className='h-4 w-4 flex-shrink-0' />
                      <span>Ödemleriniz 256-bit SSL sertifikası ile korunmaktadır</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'review' && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Sipariş Özeti</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {/* Service */}
                    <div className='flex gap-4'>
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo}`}>
                        <selectedService.icon className='h-7 w-7 text-white' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-semibold'>{selectedService.name}</h4>
                        <p className='text-sm text-muted-foreground'>{billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'} plan</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold'>₺{price.toLocaleString('tr-TR')}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* User Info */}
                    <div className='space-y-2'>
                      <h4 className='font-semibold text-sm'>Fatura Bilgileri</h4>
                      <div className='grid gap-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Ad Soyad:</span>
                          <span className='font-medium'>{formData.name}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>E-posta:</span>
                          <span className='font-medium'>{formData.email}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Telefon:</span>
                          <span className='font-medium'>{formData.phone}</span>
                        </div>
                        {formData.company && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Şirket:</span>
                            <span className='font-medium'>{formData.company}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Method */}
                    <div className='space-y-2'>
                      <h4 className='font-semibold text-sm'>Ödeme Yöntemi</h4>
                      <div className='flex items-center gap-2'>
                        {paymentMethod === 'card' && <CreditCard className='h-5 w-5 text-primary' />}
                        {paymentMethod === 'iyzico' && <Landmark className='h-5 w-5 text-primary' />}
                        {paymentMethod === 'stripe' && <Building2 className='h-5 w-5 text-primary' />}
                        {paymentMethod === 'bank' && <Building className='h-5 w-5 text-primary' />}
                        <span className='font-medium capitalize'>{paymentMethod === 'card' ? 'Kredi Kartı' : paymentMethod === 'bank' ? 'Havale/EFT' : paymentMethod}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mobile Order Summary & Terms (Only on Review Step) */}
              {currentStep === 'review' && (
                <div className='space-y-4 md:hidden'>
                  {/* Order Summary */}
                  <Card className='bg-muted/50 dark:bg-primary/5 border-primary/20 dark:border-primary/30'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-base'>Sipariş Özeti</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Ara Toplam</span>
                        <span>₺{price.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>KDV (%20)</span>
                        <span>₺{tax.toLocaleString('tr-TR')}</span>
                      </div>
                      <Separator className='bg-border/50' />
                      <div className='flex justify-between text-base font-bold'>
                        <span>Toplam</span>
                        <span className='text-primary dark:text-primary'>₺{total.toLocaleString('tr-TR')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Terms Checkbox - Mobile */}
                  <div className='flex items-start gap-3 px-1'>
                    <Checkbox
                      id='terms-mobile'
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className='mt-0.5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                    />
                    <label
                      htmlFor='terms-mobile'
                      className='text-sm leading-relaxed cursor-pointer text-foreground dark:text-foreground font-medium'
                    >
                      <a href='#' className='text-primary dark:text-primary font-semibold hover:underline'>Kullanım koşullarını</a> okudum ve kabul ediyorum
                    </label>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Buttons */}
              <div className='flex gap-3 md:hidden'>
                {currentStep !== 'billing' && (
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-1'
                    onClick={prevStep}
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Geri
                  </Button>
                )}
                {currentStep !== 'review' ? (
                  <Button
                    type='button'
                    className='flex-1'
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Devam
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                ) : (
                  <Button
                    type='submit'
                    className='flex-1'
                    disabled={!agreedToTerms}
                  >
                    <Lock className='mr-2 h-5 w-5' />
                    Ödemeyi Tamamla
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary (Always Visible on Desktop) */}
            <div className='hidden lg:block space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Service */}
                  <div className='flex gap-4'>
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${selectedService.gradientFrom} ${selectedService.gradientTo}`}>
                      <selectedService.icon className='h-7 w-7 text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h4 className='font-semibold truncate'>{selectedService.name}</h4>
                      <p className='text-sm text-muted-foreground'>{billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'} plan</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold'>₺{price.toLocaleString('tr-TR')}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Pricing Breakdown */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Ara Toplam</span>
                      <span>₺{price.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>KDV (%20)</span>
                      <span>₺{tax.toLocaleString('tr-TR')}</span>
                    </div>
                    <Separator />
                    <div className='flex justify-between text-base font-bold'>
                      <span>Toplam</span>
                      <span className='text-primary'>₺{total.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>

                  {billingPeriod === 'yearly' && (
                    <div className='flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm'>
                      <Shield className='h-4 w-4 text-primary flex-shrink-0' />
                      <span className='text-primary'>Yıllık ödemede %17 tasarruf edersiniz</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Badge */}
              <Card className='bg-muted/30 border-border/50'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                    <Lock className='h-4 w-4' />
                    <span>Güvenli Ödeme</span>
                  </div>
                </CardContent>
              </Card>

              {/* Terms */}
              {currentStep === 'review' && (
                <Card className='bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary/40'>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <Checkbox
                        id='terms'
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        className='mt-0.5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                      />
                      <label
                        htmlFor='terms'
                        className='text-sm leading-relaxed cursor-pointer text-foreground dark:text-foreground font-medium'
                      >
                        <a href='#' className='text-primary dark:text-primary font-semibold hover:underline'>Kullanım koşullarını</a> okudum ve kabul ediyorum
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Desktop Checkout Button */}
              {currentStep === 'review' && (
                <Button
                  type='submit'
                  className='w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg shadow-primary/25'
                  disabled={!agreedToTerms}
                >
                  <Lock className='mr-2 h-5 w-5' />
                  Ödemeyi Tamamla
                </Button>
              )}
            </div>
          </div>
        </form>
      </Main>
    </>
  )
}
