import { useNavigate } from '@tanstack/react-router'
import { useClerk } from '@clerk/clerk-react'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/sign-in', replace: true })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Çıkış Yap'
      desc='Çıkış yapmak istediğinizden emin misiniz? Hesabınıza tekrar erişmek için yeniden giriş yapmanız gerekecek.'
      confirmText='Çıkış Yap'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
