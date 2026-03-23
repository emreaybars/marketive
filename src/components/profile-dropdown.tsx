import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut, User, Settings } from 'lucide-react'
import { useAuth, useUser } from '@/context/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function ProfileDropdown() {
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.email?.[0]?.toUpperCase() || 'K')

  const displayName = user?.fullName || user?.email || 'Kullanıcı'
  const avatarUrl = user?.avatarUrl || ''

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/sign-in', replace: true })
  }

  if (!isLoaded) {
    return <div className='h-8 w-8' />
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            {avatarUrl && (
              <AvatarImage src={avatarUrl} alt={displayName} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-xs leading-none text-muted-foreground'>
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to='/settings'>
            <User className='mr-2 h-4 w-4' />
            <span>Profil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/settings'>
            <Settings className='mr-2 h-4 w-4' />
            <span>Ayarlar</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className='text-red-600 focus:text-red-600'>
          <LogOut className='mr-2 h-4 w-4' />
          <span>Çıkış Yap</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
