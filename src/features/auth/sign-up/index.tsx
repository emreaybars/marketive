import { SignUp as ClerkSignUp } from '@clerk/clerk-react'
import { AuthLayout } from '../auth-layout'

export function SignUp() {
  return (
    <AuthLayout>
      <ClerkSignUp signInUrl='/sign-in' />
    </AuthLayout>
  )
}
