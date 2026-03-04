import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { WhatsAppStats } from './components/whatsapp-stats'
import { WhatsAppChart } from './components/whatsapp-chart'
import { WhatsAppCampaignsList } from './components/whatsapp-campaigns-list'
import { WhatsAppIntegrationDrawer } from './components/whatsapp-integration-drawer'
import { WhatsAppProvider } from './components/whatsapp-provider'
import { WhatsAppChat } from './components/whatsapp-chat'
import { WhatsAppCampaignsDrawer } from './components/whatsapp-campaigns-drawer'
import { WhatsAppContactsDrawer } from './components/whatsapp-contacts-drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, BarChart3, Users } from 'lucide-react'

export function WhatsApp() {
  return (
    <WhatsAppProvider>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100'>WhatsApp Marketing</h2>
            <p className='text-slate-500 dark:text-slate-400'>
              WhatsApp ile müşterilerinize ulaşın, kampanyalar yönetin
            </p>
          </div>
          <div className='flex gap-2'>
            <WhatsAppContactsDrawer />
            <WhatsAppCampaignsDrawer />
            <WhatsAppIntegrationDrawer />
          </div>
        </div>

        {/* Stats */}
        <WhatsAppStats />

        {/* Main content tabs */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mesajlar
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Kampanyalar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Users className="h-4 w-4" />
              Analitik
            </TabsTrigger>
          </TabsList>

          {/* Chat tab */}
          <TabsContent value="chat" className="mt-0">
            <WhatsAppChat />
          </TabsContent>

          {/* Campaigns tab */}
          <TabsContent value="campaigns" className="mt-0 space-y-6">
            <WhatsAppChart />
            <WhatsAppCampaignsList />
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics" className="mt-0 space-y-6">
            <WhatsAppChart />
            <WhatsAppCampaignsList />
          </TabsContent>
        </Tabs>
      </Main>
    </WhatsAppProvider>
  )
}
