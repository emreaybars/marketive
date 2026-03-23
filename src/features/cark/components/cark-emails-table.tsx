'use client'

import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Search, ArrowUpDown, RefreshCw, TurkishLira, Filter, Download } from 'lucide-react'
import { useCark, WheelSpinResult } from './cark-provider'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-slate-700 dark:text-slate-300 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="border-slate-100 dark:border-slate-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-slate-700 dark:text-slate-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500 dark:text-slate-400">
                Henüz çark dönüşü yok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function CarkEmailsTable() {
  const { wheelSpins, loading, refreshWheelSpins } = useCark()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showOnlyWithOrders, setShowOnlyWithOrders] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)

  // CSV Export fonksiyonu
  const exportToCSV = () => {
    setIsExporting(true)

    try {
      // Sadece siparişi olanları filtrele
      const ordersOnly = wheelSpins.filter(spin => spin.order_amount > 0)

      if (ordersOnly.length === 0) {
        alert('Dışa aktarılacak sipariş bulunamadı!')
        return
      }

      // CSV başlıkları
      const headers = ['Ad Soyad', 'E-posta', 'Telefon', 'Kazanılan Ödül', 'Kupon Kodu', 'Sipariş Tutarı', 'Sipariş Tarihi', 'Çark Tarihi']

      // CSV verileri
      const rows = ordersOnly.map(spin => [
        spin.full_name || '',
        spin.email || '',
        spin.phone || '',
        spin.prize_name,
        spin.coupon_code || '',
        `₺${spin.order_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        spin.order_date ? new Date(spin.order_date).toLocaleString('tr-TR') : '',
        new Date(spin.created_at).toLocaleString('tr-TR')
      ])

      // CSV oluştur
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // BOM ekle (Excel için Türkçe karakter desteği)
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      // Download linki oluştur
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `siparisler-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setIsExporting(false)
    }
  }

  // Filtreleme
  const filteredSpins = React.useMemo(() => {
    return wheelSpins.filter((spin) => {
      // Arama filtresi
      const searchTerm = searchQuery.toLowerCase()
      const matchesSearch =
        (spin.full_name?.toLowerCase().includes(searchTerm) || false) ||
        (spin.email?.toLowerCase().includes(searchTerm) || false) ||
        (spin.phone?.toLowerCase().includes(searchTerm) || false) ||
        spin.prize_name.toLowerCase().includes(searchTerm)

      // Sipariş filtresi
      const matchesOrderFilter = !showOnlyWithOrders || (spin.order_amount > 0)

      return matchesSearch && matchesOrderFilter
    })
  }, [wheelSpins, searchQuery, showOnlyWithOrders])

  // Kolon tanımları
  const columns: ColumnDef<WheelSpinResult>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Ad Soyad
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const fullName = row.original.full_name
        return <div className="font-medium text-slate-800 dark:text-slate-200">{fullName || '-'}</div>
      },
    },
    {
      accessorKey: 'contact',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            İletişim
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const email = row.original.email
        const phone = row.original.phone
        return (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {email || phone || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'prize_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Kazanılan Ödül
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge className="font-normal bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
          {row.getValue('prize_name')}
        </Badge>
      ),
    },
    {
      accessorKey: 'coupon_code',
      header: 'Kupon Kodu',
      cell: ({ row }) => {
        const code = row.original.coupon_code
        return code ? (
          <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-sm font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {code}
          </code>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>
        )
      },
    },
    {
      accessorKey: 'order_amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <div className="flex items-center gap-2">
              <TurkishLira className="h-3 w-3" />
              Sipariş Tutarı
            </div>
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.original.order_amount || 0
        const hasOrder = amount > 0

        return (
          <div className="flex items-center gap-2">
            {hasOrder ? (
              <>
                <Badge className="font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                  ₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Badge>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">✓</span>
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'order_date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Sipariş Tarihi
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const orderDate = row.original.order_date
        return orderDate ? (
          <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            {new Date(orderDate).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Çark Tarihi
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return (
          <div className="text-slate-500 dark:text-slate-400 text-sm">
            {date.toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )
      },
    },
  ]

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 blur-xl" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-slate-800 dark:text-slate-100">
                  Çark Dönüşleri
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Çarkı çeviren kullanıcılar ve kazandıkları ödüller ({filteredSpins.length} kayıt)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Arama */}
            <div className="relative flex-1 sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Ad, e-posta, telefon veya ödül ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-slate-200 dark:border-slate-700 focus:border-emerald-300 dark:focus:border-emerald-700"
              />
            </div>

            {/* Sipariş filtre butonu */}
            <Button
              variant={showOnlyWithOrders ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyWithOrders(!showOnlyWithOrders)}
              className={showOnlyWithOrders
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                : "border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              Sadece Sipariş
            </Button>

            {/* Excel export butonu */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={isExporting}
              className="border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Hazırlanıyor...' : 'Excel Çıktı'}
            </Button>

            {/* Yenile butonu */}
            <Button
              variant="outline"
              size="icon"
              onClick={refreshWheelSpins}
              disabled={loading}
              title="Yenile"
              className="border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <DataTable columns={columns} data={filteredSpins} />
      </CardContent>
    </Card>
  )
}
