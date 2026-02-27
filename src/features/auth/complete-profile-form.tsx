import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, UserCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'

export function CompleteProfileForm() {
  const { user, isLoaded } = useUser()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Lütfen isim ve soyisim alanlarını doldurun')
      return
    }

    if (!phoneNumber.trim()) {
      toast.error('Lütfen telefon numaranızı girin')
      return
    }

    // Türkiye telefon formatı kontrolü
    const phoneRegex = /^(05|5)\d{9}$/
    const cleanPhone = phoneNumber.replace(/\s/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Geçerli bir telefon numarası girin (Örn: 0555 123 45 67)')
      return
    }

    setIsLoading(true)

    try {
      await user?.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      // Telefon numarasını unsafeMetadata'da sakla
      await user?.update({
        unsafeMetadata: {
          ...(user?.unsafeMetadata || {}),
          phoneNumber: cleanPhone,
        },
      })

      toast.success('Profil bilgileriniz güncellendi')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Profil güncellenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Sadece sayıları al
    const cleaned = value.replace(/\D/g, '')
    // Maksimum 10 hane (05xxxxxxxxx)
    const truncated = cleaned.slice(0, 10)
    setPhoneNumber(formatPhoneNumber(truncated))
  }

  if (!isLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin' />
      </div>
    )
  }

  return (
    <div className='flex min-h-svh items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <UserCircle className='h-8 w-8 text-primary' />
          </div>
          <CardTitle>Profil Bilgilerinizi Tamamlayın</CardTitle>
          <CardDescription>
            Apple ile giriş yaptınız. Lütfen hesabınızı tamamlamak için bilgilerinizi girin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='firstName'>Ad *</Label>
              <Input
                id='firstName'
                placeholder='Adınız'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='lastName'>Soyad *</Label>
              <Input
                id='lastName'
                placeholder='Soyadınız'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phoneNumber'>Telefon Numarası *</Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='phoneNumber'
                  placeholder='0555 123 45 67'
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                  required
                  className='pl-10'
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                Türkiye telefon numarası formatında girin (05xx xxx xx xx)
              </p>
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Kaydediliyor...
                </>
              ) : (
                'Devam Et'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
