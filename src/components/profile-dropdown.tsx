import { UserButton } from '@clerk/clerk-react'

export function ProfileDropdown() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'h-8 w-8',
        },
      }}
      afterSignOutUrl='/sign-in'
    />
  )
}
