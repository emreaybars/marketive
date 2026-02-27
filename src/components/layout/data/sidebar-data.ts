import {
  LayoutDashboard,
  BotMessageSquare,
  AudioWaveform,
  FerrisWheel,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'Marketive',
      logo: Command,
      plan: 'Yönetim Paneli',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Genel',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Çarkıfelek',
          url: '/cark',
          icon: FerrisWheel,
        },
        {
          title: 'Whatsapp Marketing',
          url: '/whatsapp',
          icon: BotMessageSquare,
        }
      ],
    },
  ],
}
