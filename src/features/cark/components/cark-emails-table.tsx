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
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
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
            className="h-8 px-0"
          >
            Ad Soyad
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const fullName = row.original.full_name
        return <div className="font-medium">{fullName || '-'}</div>
      },
    },
    {
      accessorKey: 'contact',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0"
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
          <div className="text-sm text-muted-foreground">
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
            className="h-8 px-0"
          >
            Kazanılan Ödül
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
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
          <code className="px-2 py-1 rounded bg-muted text-sm font-mono">
            {code}
          </code>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
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
            className="h-8 px-0"
          >
            Tarih
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return (
          <div className="text-muted-foreground text-sm">
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Çark Dönüşleri
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Çarkı çeviren kullanıcılar ve kazandıkları ödüller ({filteredSpins.length} kayıt)
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Arama */}
            <div className="relative flex-1 sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ad, e-posta, telefon veya ödül ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Yenile butonu */}
            <Button
              variant="outline"
              size="icon"
              onClick={refreshWheelSpins}
              disabled={loading}
              title="Yenile"
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
