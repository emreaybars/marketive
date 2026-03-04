import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, KeyRound, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  password: z
    .string()
    .min(1, 'Lütfen yeni şifrenizi girin')
    .min(7, 'Şifre en az 7 karakter uzunluğunda olmalıdır'),
  confirmPassword: z.string().min(1, 'Lütfen şifrenizi doğrulayın'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

export function ResetPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const { error } = await updatePassword(data.password)

      if (error) {
        toast.error(error.message || 'Şifre güncellenemedi')
      } else {
        setIsSuccess(true)
        toast.success('Şifreniz başarıyla güncellendi')
        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          navigate({ to: '/sign-in' })
        }, 2000)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Şifre güncellenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
            <CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
          </div>
          <CardTitle>Şifre Güncellendi</CardTitle>
          <CardDescription>
            Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)} {...props}>
      <CardHeader className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
          <KeyRound className='h-8 w-8 text-primary' />
        </div>
        <CardTitle>Yeni Şifre Belirle</CardTitle>
        <CardDescription>
          Hesabınız için yeni bir şifre belirleyin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-4'
          >
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yeni Şifre</FormLabel>
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
            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? <Loader2 className='animate-spin' /> : null}
              Şifreyi Güncelle
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
