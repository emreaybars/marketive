import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCark } from './cark-provider'
import { MoreHorizontal, ArrowRight, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const statusVariants = {
  active: 'default',
  inactive: 'secondary',
  archived: 'outline',
} as const

const statusLabels = {
  active: 'Aktif',
  inactive: 'Pasif',
  archived: 'Arşivlendi',
} as const

export function CarkWheelsList() {
  const { wheels } = useCark()

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
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold'>{wheel.name}</h3>
                  <Badge variant={statusVariants[wheel.status]}>
                    {statusLabels[wheel.status]}
                  </Badge>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {wheel.spins} çevirme • {new Date(wheel.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' asChild>
                  <a href={`/cark/${wheel.id}`}>
                    Detay
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </a>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem>
                      <Edit className='mr-2 h-4 w-4' />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem className='text-destructive'>
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
