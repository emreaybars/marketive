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
import { Mail, Search, ArrowUpDown, RefreshCw } from 'lucide-react'
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
                className="border-slate-100 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors"
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

  // Filtreleme
  const filteredSpins = React.useMemo(() => {
    return wheelSpins.filter((spin) => {
      const searchTerm = searchQuery.toLowerCase()
      return (
        (spin.full_name?.toLowerCase().includes(searchTerm) || false) ||
        (spin.email?.toLowerCase().includes(searchTerm) || false) ||
        (spin.phone?.toLowerCase().includes(searchTerm) || false) ||
        spin.prize_name.toLowerCase().includes(searchTerm)
      )
    })
  }, [wheelSpins, searchQuery])

  // Kolon tanımları
  const columns: ColumnDef<WheelSpinResult>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
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
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
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
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Kazanılan Ödül
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge className="font-normal bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
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
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Tarih
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
                <div className="absolute inset-0 bg-blue-500/10 blur-xl" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                className="pl-9 border-slate-200 dark:border-slate-700 focus:border-blue-300 dark:focus:border-blue-700"
              />
            </div>

            {/* Yenile butonu */}
            <Button
              variant="outline"
              size="icon"
              onClick={refreshWheelSpins}
              disabled={loading}
              title="Yenile"
              className="border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
