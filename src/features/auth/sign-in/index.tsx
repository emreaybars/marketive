import { UserAuthForm } from './components/user-auth-form'
import { AuthLayout } from '../auth-layout'

interface SignInProps {
  redirectTo?: string
}

export function SignIn({ redirectTo }: SignInProps) {
  return (
    <AuthLayout>
      <UserAuthForm redirectTo={redirectTo} />
    </AuthLayout>
  )
}
