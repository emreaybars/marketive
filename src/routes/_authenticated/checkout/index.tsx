import { createFileRoute } from '@tanstack/react-router'
import { Checkout } from '@/features/checkout'

export const Route = createFileRoute('/_authenticated/checkout/')({
  component: Checkout,
})
