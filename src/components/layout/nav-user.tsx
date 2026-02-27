import { useState } from 'react'
import { LifeBuoy, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useUser, useClerk, UserButton } from '@clerk/clerk-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavUser() {
  const { user, isLoaded } = useUser()
  const { openUserProfile } = useClerk()
  const [menuOpen] = useState(false)

  const primaryEmail = user?.emailAddresses?.[0]?.emailAddress
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (primaryEmail?.[0]?.toUpperCase() || 'K')

  const displayName = user?.fullName || primaryEmail || 'Kullanıcı'
  const email = primaryEmail || ''
  const avatarUrl = user?.imageUrl || ''

  if (!isLoaded) {
    return null
  }

  return (
    <SidebarMenu className='gap-2 p-2'>
      {/* User Info with Clerk Menu */}
      <SidebarMenuItem>
        <div
          className='flex items-center gap-2 px-2 py-1.5 w-full rounded-lg hover:bg-sidebar-accent cursor-pointer relative'
          onClick={() => {
            if (!menuOpen) {
              const trigger = document.querySelector('[data-clerk-userbutton-trigger]') as HTMLElement
              trigger?.click()
            }
          }}
        >
          <UserButton
            appearance={{
              elements: {
                rootBox: 'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                avatarBox: 'h-8 w-8 rounded-lg opacity-0 pointer-events-auto',
              },
            }}
            afterSignOutUrl='/sign-in'
          />
          <Avatar className='h-8 w-8 rounded-lg pointer-events-none'>
            {isLoaded && avatarUrl && (
              <AvatarImage src={avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
          </Avatar>
          <div className='grid flex-1 text-start text-sm leading-tight pointer-events-none'>
            <span className='truncate font-semibold'>{displayName}</span>
            <span className='truncate text-xs'>{email}</span>
          </div>
          <ChevronRight className='h-4 w-4 opacity-50 pointer-events-none' />
        </div>
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

      {/* Settings Button - Opens Clerk Modal */}
      <SidebarMenuItem>
        <Button
          variant='ghost'
          className='w-full justify-start gap-2 h-9 px-2'
          onClick={() => openUserProfile()}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='h-4 w-4'
          >
            <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
            <circle cx='12' cy='12' r='3' />
          </svg>
          <span className='text-sm'>Ayarlar</span>
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
