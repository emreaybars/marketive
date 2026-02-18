import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { CompleteProfileForm } from '@/features/auth/complete-profile-form'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()

  if (!isLoaded || !isUserLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin' />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to='/sign-in' />
  }

  // Check if user has first and last name
  const firstName = user?.firstName
  const lastName = user?.lastName
  const needsProfileCompletion = !firstName || !lastName || firstName.trim() === '' || lastName.trim() === ''

  if (needsProfileCompletion) {
    return <CompleteProfileForm />
  }

  return <AuthenticatedLayout />
}
