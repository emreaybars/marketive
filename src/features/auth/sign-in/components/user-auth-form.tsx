import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { IconFacebook, IconGithub } from '@/assets/brand-icons'
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
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn, isLoaded } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!isLoaded) return

    setIsLoading(true)

    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        toast.error(error.message || 'Giriş başarısız')
      } else {
        toast.success('Giriş başarılı!')
        const targetPath = redirectTo || '/'
        navigate({ to: targetPath, replace: true })
      }
    } catch (error: any) {
      toast.error(error?.message || 'Giriş başarısız')
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
            <FormItem className='relative'>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                Şifremi unuttum?
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading || !isLoaded}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Giriş Yap
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              Veya şununla devam et
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>

        <p className='px-8 text-center text-sm text-muted-foreground'>
          Hesabınız yok mu?{' '}
          <Link
            to='/sign-up'
            className='underline underline-offset-4 hover:text-primary font-medium'
          >
            Kayıt Olun
          </Link>
        </p>
      </form>
    </Form>
  )
}
