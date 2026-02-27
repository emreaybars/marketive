'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface Wheel {
  id: string
  name: string
  spins: number
  createdAt: string
  status: 'active' | 'inactive' | 'archived'
}

interface CarkContextType {
  wheels: Wheel[]
  createWheel: (name: string) => void
}

const CarkContext = createContext<CarkContextType | undefined>(undefined)

export function CarkProvider({ children }: { children: ReactNode }) {
  const [wheels, setWheels] = useState<Wheel[]>([
    { id: '1', name: 'Haftalık Çark', spins: 152, createdAt: '2025-01-15', status: 'active' },
    { id: '2', name: 'Kampanya Çarkı', spins: 89, createdAt: '2025-02-01', status: 'active' },
    { id: '3', name: 'Özel Etkinlik', spins: 45, createdAt: '2025-02-10', status: 'inactive' },
  ])

  const createWheel = (name: string) => {
    const newWheel: Wheel = {
      id: Date.now().toString(),
      name,
      spins: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    }
    setWheels((prev) => [...prev, newWheel])
  }

  return (
    <CarkContext.Provider value={{ wheels, createWheel }}>{children}</CarkContext.Provider>
  )
}

export function useCark() {
  const context = useContext(CarkContext)
  if (!context) {
    throw new Error('useCark must be used within CarkProvider')
  }
  return context
}
