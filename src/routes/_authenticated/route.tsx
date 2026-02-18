import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin' />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to='/sign-in' />
  }

  return <AuthenticatedLayout />
}
