import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(1, 'Lütfen şifrenizi girin')
    .min(7, 'Şifre en az 7 karakter uzunluğunda olmalıdır'),
  confirmPassword: z.string().min(1, 'Lütfen şifrenizi doğrulayın'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

interface UserSignUpFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserSignUpForm({
  className,
  redirectTo,
  ...props
}: UserSignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { signUp, isLoaded } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!isLoaded) return

    setIsLoading(true)

    try {
      const { error } = await signUp(data.email, data.password)

      if (error) {
        toast.error(error.message || 'Kayıt başarısız')
      } else {
        toast.success('Kayıt başarılı! E-posta adresinizi doğrulayın.')
        const targetPath = redirectTo || '/'
        navigate({ to: targetPath, replace: true })
      }
    } catch (error: any) {
      toast.error(error?.message || 'Kayıt başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input placeholder='ornek@email.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre Doğrula</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading || !isLoaded}>
          {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
          Kayıt Ol
        </Button>

        <p className='px-8 text-center text-sm text-muted-foreground'>
          Zaten hesabınız var mı?{' '}
          <Link
            to='/sign-in'
            className='underline underline-offset-4 hover:text-primary font-medium'
          >
            Giriş Yapın
          </Link>
        </p>
      </form>
    </Form>
  )
}
