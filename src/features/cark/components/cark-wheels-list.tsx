'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCark } from './cark-provider'
import { MoreHorizontal, Edit, Trash2, Copy, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function CarkWheelsList() {
  const { wheels, loading, deleteWheel } = useCark()

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${name} çarkını silmek istediğinizden emin misiniz?`)) {
      await deleteWheel(id)
    }
  }

  const handleCopyEmbed = (embedCode?: string) => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode)
      alert('Embed kodu kopyalandı!')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Yükleniyor...</div>
        </CardContent>
      </Card>
    )
  }

  if (wheels.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              Henüz çark oluşturmadınız. İlk çarkınızı oluşturmak için "Çark Oluştur" butonuna tıklayın.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mevcut Çarklar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {wheels.map((wheel) => (
            <div
              key={wheel.id}
              className='flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='flex-1'>
                <div className='flex items-center gap-3'>
                  {wheel.logo_url && (
                    <div className='h-12 w-12 rounded-md bg-background flex items-center justify-center overflow-hidden border'>
                      <img
                        src={wheel.logo_url}
                        alt={wheel.name}
                        className='h-full w-full object-contain'
                      />
                    </div>
                  )}
                  <div>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold'>{wheel.name}</h3>
                      <Badge variant={wheel.active ? 'default' : 'secondary'}>
                        {wheel.active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {wheel.shop_id} • {new Date(wheel.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleCopyEmbed(wheel.embed_code)}
                >
                  <Copy className='mr-2 h-4 w-4' />
                  Embed Kodu
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem>
                      <Eye className='mr-2 h-4 w-4' />
                      Önizle
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className='mr-2 h-4 w-4' />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() => handleDelete(wheel.id, wheel.name)}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
