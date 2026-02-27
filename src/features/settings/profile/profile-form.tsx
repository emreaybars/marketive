import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const profileFormSchema = z.object({
  username: z
    .string('Lütfen kullanıcı adınızı girin.')
    .min(2, 'Kullanıcı adı en az 2 karakter olmalıdır.')
    .max(30, 'Kullanıcı adı 30 karakterden uzun olmamalıdır.'),
  email: z.email({
    error: (iss) =>
      iss.input === undefined
        ? 'Lütfen görüntülemek için bir e-posta seçin.'
        : undefined,
  }),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.url('Lütfen geçerli bir URL girin.'),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// This can come from your database or API.
const defaultValues: Partial<ProfileFormValues> = {
  bio: 'I own a computer.',
  urls: [
    { value: 'https://shadcn.com' },
    { value: 'http://twitter.com/shadcn' },
  ],
}

export function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => showSubmittedData(data))}
        className='space-y-8'
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kullanıcı Adı</FormLabel>
              <FormControl>
                <Input placeholder='kullaniciadi' {...field} />
              </FormControl>
              <FormDescription>
                Bu sizin herkese açık görünen adınızdır. Gerçek adınız veya bir
                takma ad olabilir. Bunu sadece 30 günde bir kez değiştirebilirsiniz.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Görüntülemek için doğrulanmış bir e-posta seçin' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='m@example.com'>m@example.com</SelectItem>
                  <SelectItem value='m@google.com'>m@google.com</SelectItem>
                  <SelectItem value='m@support.com'>m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Doğrulanmış e-posta adreslerinizi{' '}
                <Link to='/'>e-posta ayarlarınızdan</Link> yönetebilirsiniz.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biyografi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Kendiniz hakkında biraz bilgi verin'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Bağlantı vermek için diğer kullanıcıları ve kuruluşları{' '}
                <span>@bahsetme</span> şeklinde belirtebilirsiniz.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && 'sr-only')}>
                    URL'ler
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && 'sr-only')}>
                    Web sitenize, blogunuza veya sosyal medya profillerinize bağlantılar ekleyin.
                  </FormDescription>
                  <FormControl className={cn(index !== 0 && 'mt-1.5')}>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => append({ value: '' })}
          >
            URL Ekle
          </Button>
        </div>
        <Button type='submit'>Profili güncelle</Button>
      </form>
    </Form>
  )
}
