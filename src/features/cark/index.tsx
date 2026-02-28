import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CarkStats } from './components/cark-stats'
import { CarkChart } from './components/cark-chart'
import { CarkEmailsTable } from './components/cark-emails-table'
import { CarkCreateDrawer } from './components/cark-create-drawer'
import { CarkIntegrationDialog } from './components/cark-integration-dialog'
import { CarkWheelsList } from './components/cark-wheels-list'
import { CarkProvider } from './components/cark-provider'

export function Cark() {
  return (
    <CarkProvider>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Çarkıfelek</h2>
            <p className='text-muted-foreground'>
              Çarklarınızı yönetin ve istatistikleri görün
            </p>
          </div>
          <div className='flex gap-2'>
            <CarkIntegrationDialog />
            <CarkCreateDrawer />
          </div>
        </div>

        {/* İstatistikler */}
        <CarkStats />

        {/* Grafik */}
        <CarkChart />

        {/* Çark Listesi */}
        <CarkWheelsList />

        {/* E-posta Tablosu */}
        <CarkEmailsTable />
      </Main>
    </CarkProvider>
  )
}
