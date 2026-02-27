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
import { Mail, Search, ArrowUpDown } from 'lucide-react'

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
                Sonuç bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Email veri tipi
interface EmailData {
  id: string
  email: string
  prize: string
  sentAt: string
}

// Mock email verileri
const mockEmails: EmailData[] = [
  {
    id: '1',
    email: 'ahmet.yilmaz@example.com',
    prize: '100TL İndirim',
    sentAt: '2024-06-30T14:30:00',
  },
  {
    id: '2',
    email: 'ayse.demir@example.com',
    prize: 'Ücretsiz Kargo',
    sentAt: '2024-06-30T14:25:00',
  },
  {
    id: '3',
    email: 'mehmet.kaya@example.com',
    prize: '50TL Hediye Çeki',
    sentAt: '2024-06-30T14:20:00',
  },
  {
    id: '4',
    email: 'fatma.ozturk@example.com',
    prize: '100TL İndirim',
    sentAt: '2024-06-30T14:15:00',
  },
  {
    id: '5',
    email: 'ali.celik@example.com',
    prize: '200TL İndirim',
    sentAt: '2024-06-30T14:10:00',
  },
  {
    id: '6',
    email: 'zeynep.aras@example.com',
    prize: 'Ücretsiz Kargo',
    sentAt: '2024-06-30T14:05:00',
  },
  {
    id: '7',
    email: 'mustafa.eren@example.com',
    prize: '100TL İndirim',
    sentAt: '2024-06-30T14:00:00',
  },
  {
    id: '8',
    email: 'elif.yildiz@example.com',
    prize: '50TL Hediye Çeki',
    sentAt: '2024-06-30T13:55:00',
  },
  {
    id: '9',
    email: 'can.bozkurt@example.com',
    prize: 'Ücretsiz Kargo',
    sentAt: '2024-06-30T13:50:00',
  },
  {
    id: '10',
    email: 'deniz.sahin@example.com',
    prize: '100TL İndirim',
    sentAt: '2024-06-30T13:45:00',
  },
  {
    id: '11',
    email: 'emre.turk@example.com',
    prize: '200TL İndirim',
    sentAt: '2024-06-30T13:40:00',
  },
  {
    id: '12',
    email: 'selin.aydin@example.com',
    prize: 'Ücretsiz Kargo',
    sentAt: '2024-06-30T13:35:00',
  },
]

export function CarkEmailsTable() {
  const [emails] = React.useState<EmailData[]>(mockEmails)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Filtreleme
  const filteredEmails = React.useMemo(() => {
    return emails.filter((email) => {
      return (
        email.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.prize.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [emails, searchQuery])

  // Kolon tanımları
  const columns: ColumnDef<EmailData>[] = [
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-0"
          >
            E-posta
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'prize',
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
          {row.getValue('prize')}
        </Badge>
      ),
    },
    {
      accessorKey: 'sentAt',
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
        const date = new Date(row.getValue('sentAt'))
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
              Son E-posta Verileri
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Çarktan gelen e-posta kayıtları ({filteredEmails.length} kayıt)
            </p>
          </div>

          {/* Arama */}
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="E-posta veya ödül ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <DataTable columns={columns} data={filteredEmails} />
      </CardContent>
    </Card>
  )
}
