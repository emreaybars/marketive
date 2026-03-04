import { UserSignUpForm } from './components/user-sign-up-form'
import { AuthLayout } from '../auth-layout'

interface SignUpProps {
  redirectTo?: string
}

export function SignUp({ redirectTo }: SignUpProps) {
  return (
    <AuthLayout>
      <UserSignUpForm redirectTo={redirectTo} />
    </AuthLayout>
  )
}
