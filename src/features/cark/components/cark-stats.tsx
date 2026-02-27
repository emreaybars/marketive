import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Mail, Ticket } from 'lucide-react'

export function CarkStats() {
  const stats = [
    {
      title: 'Günlük Çevirme',
      value: '1,234',
      change: '+12.5',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Toplam E-posta',
      value: '8,456',
      change: '+5.2',
      icon: Mail,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Kullanılan Kupon',
      value: '567',
      change: '+8.1',
      icon: Ticket,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {stats.map((stat) => (
        <Card key={stat.title} className='overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stat.value}</div>
            <p className='text-xs text-muted-foreground'>
              <span className='text-emerald-500'>{stat.change}</span> geçen haftaya göre
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
