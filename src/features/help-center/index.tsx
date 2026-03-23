import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Mail,
  MessageSquare,
  Phone,
  Send,
  BookOpen,
  HeadphonesIcon,
  AlertCircle,
} from 'lucide-react'

const supportCategories = [
  {
    title: 'Sık Sorulan Sorular',
    description: 'En yaygın soruların cevaplarını burada bulabilirsiniz',
    icon: BookOpen,
    items: [
      'Nasıl giriş yaparım?',
      'Şifremi unuttum, ne yapmalıyım?',
      'Hesap ayarlarımı nasıl değiştirebilirim?',
      'Nasıl çıkış yaparım?',
    ],
  },
  {
    title: 'İletişim Kanalları',
    description: 'Size yardımcı olmak için buradayız',
    icon: HeadphonesIcon,
    items: [
      { label: 'Canlı Destek', icon: MessageSquare, description: '7/24 hizmetinizdeyiz' },
      { label: 'E-posta', icon: Mail, description: 'destek@marketive.com' },
      { label: 'Telefon', icon: Phone, description: '+90 212 123 45 67' },
    ],
  },
]

const faqs = [
  {
    question: 'Nasıl giriş yaparım?',
    answer: 'Ana sayfadaki "Giriş Yap" butonuna tıklayın. E-posta adresinizi ve şifrenizi girin, ardından "Giriş" butonuna basın.',
  },
  {
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer: 'Giriş sayfasında "Şifremi Unuttum" linkine tıklayın. Kayıtlı e-posta adresinizi girin ve şifre sıfırlama talimatlarını takip edin.',
  },
  {
    question: 'Hesap bilgilerimi nasıl değiştirebilirim?',
    answer: 'Ayarlar > Hesap sayfasına giderek kişisel bilgilerinizi güncelleyebilirsiniz.',
  },
  {
    question: 'Çıkış nasıl yapılır?',
    answer: 'Sol menüdeki kullanıcı bilgisi alanına tıklayın ve "Çıkış Yap" seçeneğini seçin.',
  },
]

export function HelpCenter() {
  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Destek Merkezi
          </h1>
          <p className='text-muted-foreground'>
            Size nasıl yardımcı olabiliriz?
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='grid gap-6'>
          {/* Support Categories */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {supportCategories.map((category, index) => (
              <Card key={index} className='cursor-pointer hover:shadow-md transition-shadow'>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                      <category.icon className='h-5 w-5 text-primary' />
                    </div>
                    <div>
                      <CardTitle className='text-base'>{category.title}</CardTitle>
                      <CardDescription className='text-xs'>
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      {typeof item === 'string' ? item : item.label}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className='text-xl font-semibold mb-4'>Sık Sorulan Sorular</h2>
            <div className='space-y-4'>
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className='text-base flex items-start gap-3'>
                      <AlertCircle className='h-5 w-5 text-primary mt-0.5 flex-shrink-0' />
                      {faq.question}
                    </CardTitle>
                    <CardDescription className='pl-8'>
                      {faq.answer}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                  <Send className='h-5 w-5 text-primary' />
                </div>
                <div>
                  <CardTitle className='text-base'>Bizimle İletişime Geçin</CardTitle>
                  <CardDescription className='text-xs'>
                    Sorularınız için formu doldurun, en kısa sürede yanıtlayalım
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Ad Soyad</Label>
                    <Input id='name' placeholder='Adınız Soyadınız' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>E-posta</Label>
                    <Input id='email' type='email' placeholder='ornek@email.com' />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='subject'>Konu</Label>
                  <Input id='subject' placeholder='Sorununuzu kısaca açıklayın' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='message'>Mesaj</Label>
                  <Textarea
                    id='message'
                    placeholder='Sorununuzu detaylıca açıklayın...'
                    rows={5}
                  />
                </div>
                <Button type='submit' className='w-full'>
                  <Send className='mr-2 h-4 w-4' />
                  Gönder
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
