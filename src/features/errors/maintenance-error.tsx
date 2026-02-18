import { Button } from '@/components/ui/button'

export function MaintenanceError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>503</h1>
        <span className='font-medium'>Web sitesi bakım altında!</span>
        <p className='text-center text-muted-foreground'>
          Site şu anda kullanılamıyor. <br />
          Çok kısa sürede tekrar çevrimiçi olacağız.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline'>Daha fazla bilgi</Button>
        </div>
      </div>
    </div>
  )
}
