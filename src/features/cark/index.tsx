import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { CarkStats } from './components/cark-stats'
import { CarkChart } from './components/cark-chart'
import { CarkEmailsTable } from './components/cark-emails-table'
import { CarkCreateDrawer } from './components/cark-create-drawer'
import { CarkIntegrationDialog } from './components/cark-integration-dialog'
import { CarkWheelsList } from './components/cark-wheels-list'
import { CarkPrizeAnalytics } from './components/cark-prize-analytics'
import { CarkProvider, useCark } from './components/cark-provider'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

function CarkContent() {
  const { shopIntegration, syncOrdersFromIntegration } = useCark()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncOrders = async () => {
    setIsSyncing(true)
    try {
      const result = await syncOrdersFromIntegration()
      if (result.success) {
        toast.success(`${result.data?.ordersFetched || 0} sipariş işlendi, ${result.data?.recordsUpdated || 0} kayıt güncellendi`)
      } else {
        toast.error(result.error || 'Senkronizasyon başarısız')
      }
    } catch (error) {
      toast.error('Senkronizasyon sırasında hata oluştu')
    } finally {
      setIsSyncing(false)
    }
  }

  const getPlatformLabel = (platformType: string) => {
    switch (platformType) {
      case 'ikas':
        return 'İkas'
      case 'ticimax':
        return 'Ticimax'
      case 'shopify':
        return 'Shopify'
      case 'custom':
        return 'Geliştir E-Ticaret'
      default:
        return platformType
    }
  }

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100'>Çarkıfelek</h2>
            <p className='text-slate-500 dark:text-slate-400'>
              Çarklarınızı yönetin ve istatistikleri görün
            </p>
          </div>
          <div className='flex gap-2 items-center'>
            {shopIntegration && shopIntegration.api_username && (
              <>
                <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'>
                  <span className='h-2 w-2 rounded-full bg-green-500 animate-pulse' />
                  <span className='text-sm font-medium text-green-700 dark:text-green-400'>
                    {getPlatformLabel(shopIntegration.platform_type)} Aktif
                  </span>
                </div>
                {shopIntegration.platform_type === 'custom' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleSyncOrders}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Senkronize ediliyor...' : 'Siparişleri Senkronize Et'}
                  </Button>
                )}
              </>
            )}
            <CarkIntegrationDialog />
            <CarkCreateDrawer />
          </div>
        </div>

        {/* İstatistikler */}
        <CarkStats />

        {/* Grafik */}
        <CarkChart />

        {/* Ödül Analitikleri */}
        <CarkPrizeAnalytics />

        {/* Çark Listesi */}
        <CarkWheelsList />

        {/* E-posta Tablosu */}
        <CarkEmailsTable />
      </Main>
    </>
  )
}

export function Cark() {
  return (
    <CarkProvider>
      <CarkContent />
    </CarkProvider>
  )
}
