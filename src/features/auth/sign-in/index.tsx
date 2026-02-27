import { SignIn as ClerkSignIn } from '@clerk/clerk-react'
import { AuthLayout } from '../auth-layout'

export function SignIn() {
  return (
    <AuthLayout>
      <ClerkSignIn signUpUrl='/sign-up' />
    </AuthLayout>
  )
}
