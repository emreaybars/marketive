import { useState } from 'react'
import { LifeBuoy, Settings, LogOut, User } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth, useUser } from '@/context/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NavUser() {
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.email?.[0]?.toUpperCase() || 'K')

  const displayName = user?.fullName || user?.email || 'Kullanıcı'
  const email = user?.email || ''
  const avatarUrl = user?.avatarUrl || ''

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/sign-in', replace: true })
  }

  if (!isLoaded) {
    return null
  }

  return (
    <SidebarMenu className='gap-2 p-2'>
      {/* User Info with Dropdown Menu */}
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <div className='flex items-center gap-2 px-2 py-1.5 w-full rounded-lg hover:bg-sidebar-accent cursor-pointer'>
              <Avatar className='h-8 w-8 rounded-lg'>
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>{displayName}</span>
                <span className='truncate text-xs'>{email}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            side='top'
            align='start'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  )}
                  <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>{displayName}</span>
                  <span className='truncate text-xs'>{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                <User className='mr-2 h-4 w-4' />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                <Settings className='mr-2 h-4 w-4' />
                Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className='text-red-600 focus:text-red-600'>
              <LogOut className='mr-2 h-4 w-4' />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Support Link */}
      <SidebarMenuItem>
        <Link to='/help-center' className='w-full'>
          <Button
            variant='ghost'
            className='w-full justify-start gap-2 h-9 px-2'
          >
            <LifeBuoy className='h-4 w-4' />
            <span className='text-sm'>Destek</span>
          </Button>
        </Link>
      </SidebarMenuItem>

      {/* Settings Link */}
      <SidebarMenuItem>
        <Link to='/settings' className='w-full'>
          <Button
            variant='ghost'
            className='w-full justify-start gap-2 h-9 px-2'
          >
            <Settings className='h-4 w-4' />
            <span className='text-sm'>Ayarlar</span>
          </Button>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
