import { createFileRoute, Navigate } from '@tanstack/react-router'
import { ResetPasswordForm } from '@/features/auth/reset-password/components/reset-password-form'

export const Route = createFileRoute('/(auth)/reset-password')({
  component: ResetPassword,
})

function ResetPassword() {
  // Check if we have the necessary hash params from Supabase
  const hash = window.location.hash
  const hasAccessToken = hash.includes('access_token')

  if (!hasAccessToken) {
    // If no access token, redirect to forgot password
    return <Navigate to='/forgot-password' />
  }

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 p-4'>
      <div className='flex w-full flex-col gap-6'>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
