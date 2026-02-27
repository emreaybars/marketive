import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useCark } from './cark-provider'

export function CarkCreateDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const { createWheel } = useCark()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      // Create a basic wheel with default values
      await createWheel({
        storeId: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        storeName: name.trim(),
        logoUrl: '',
        websiteUrl: '',
        brandName: '',
        contactInfoType: 'email',
        widgetTitle: 'Çarkı Çevir Hediyeni Kazan!',
        widgetDescription: 'Hediyeni almak için hemen çarkı çevir.',
        buttonText: 'ÇARKI ÇEVİR',
        backgroundColor: 'rgba(139, 0, 0, 0.7)',
        buttonColor: '#d10000',
        autoShow: false,
        showDelay: 2000,
        prizes: [
          {
            name: 'İndirim',
            description: '%10 indirim kazandınız!',
            redirectUrl: '',
            color: '#fa3939',
            chance: 34,
            couponCodes: ''
          },
          {
            name: 'Kupon',
            description: 'Ücretsiz kupon kazandınız!',
            redirectUrl: '',
            color: '#4aa3df',
            chance: 33,
            couponCodes: ''
          },
          {
            name: 'Hediye',
            description: 'Özel hediye kazandınız!',
            redirectUrl: '',
            color: '#7c3aed',
            chance: 33,
            couponCodes: ''
          }
        ]
      })
      setName('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Çark Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni Çark Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir şans çarkı oluşturun. Katılımcıların döneceği ve ödül kazanacağı bir çark
              hazırlayın.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Çark Adı</Label>
              <Input
                id='name'
                placeholder='Örn: Haftalık Çark'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type='submit'>Oluştur</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
