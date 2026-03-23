import { createFileRoute } from '@tanstack/react-router'
import { Cark } from '@/features/cark'

export const Route = createFileRoute('/_authenticated/cark/')({
  component: Cark,
})
