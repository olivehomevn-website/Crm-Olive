'use client'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, Filter, Download } from 'lucide-react'
import { PageShell, PageHeading } from '@/components/page-shell'
import { FadeIn } from '@/components/motion'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

import { OrderDetailSheet } from '@/components/orders/order-detail-sheet'

import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@/lib/data'

import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { formatVND, formatDateTime } from '@/lib/format'


const ORDER_STATUS_UI: Record<string, { label: string; text: string; dot: string; bg: string }> = {
  pending: {
    label: 'Chờ xác nhận',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  processing: {
    label: 'Đang xử lý',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  shipping: {
    label: 'Đang giao',
    text: 'text-violet-300',
    dot: 'bg-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  completed: {
    label: 'Hoàn thành',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  cancelled: {
    label: 'Đã hủy',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
}

export function OrdersListClient() {

  const router = useRouter()
  
const [query, setQuery] = useState('')
const [status, setStatus] = useState<string>('all')

const [fromDate, setFromDate] =
  useState('')

const [toDate, setToDate] =
  useState('')

const [paymentFilter, setPaymentFilter] =
  useState('all')

const [selected, setSelected] =
  useState<any>(null)

  const [orders, setOrders] =
  useState<any[]>([])
  const [open, setOpen] = useState(false)
  useEffect(() => {
  loadOrders()
}, [])

const [currentPage, setCurrentPage] =
  useState(1)

const ITEMS_PER_PAGE = 10

const loadOrders = async () => {

const { data, error } =
  await supabase
    .from('orders')
    .select(`
      *,
      customers (
  customer_code,
  customer_display_code,
  full_name,
  phone,
  address,
  customer_source
      ),
      order_items (
        *
      )
    `)
      .order(
        'created_at',
        { ascending: false }
      )

  if (error) {
    console.log(error)
    return
  }
console.log(data?.[0])

  setOrders(data || [])
}

  const filtered = useMemo(() => {


  return orders.filter((o) => {

    if (
      status !== 'all' &&
      o.status !== status
    ) {
      return false
    }

    if (
      paymentFilter !== 'all' &&
      o.payment_status !== paymentFilter
    ) {
      return false
    }

    if (
      query &&
      !(
        String(
          o.order_code || ''
        )
          .toLowerCase()
          .includes(
            query.toLowerCase()
          ) ||

        String(
          o.customers?.full_name || ''
        )
          .toLowerCase()
          .includes(
            query.toLowerCase()
          )
      )
    ) {
      return false
    }

  if (fromDate) {

  const orderDate = new Date(o.created_at)

  const startDate = new Date(fromDate)
  startDate.setHours(0, 0, 0, 0)

  if (orderDate.getTime() < startDate.getTime()) {
    return false
  }

}

if (toDate) {

  const orderDate = new Date(o.created_at)

  const endDate = new Date(toDate)
  endDate.setHours(23, 59, 59, 999)

  if (orderDate.getTime() > endDate.getTime()) {
    return false
  }

}

    return true

  })

}, [
  orders,
  query,
  status,
  paymentFilter,
  fromDate,
  toDate,
])

const activeOrders = filtered.filter(
  (o) => o.status !== 'cancelled'
)

  const totalPages = Math.ceil(
  filtered.length /
    ITEMS_PER_PAGE
)

const paginatedOrders =
  filtered.slice(
    (currentPage - 1) *
      ITEMS_PER_PAGE,
    currentPage *
      ITEMS_PER_PAGE
  )

  const openOrder = (o: any) => {
    setSelected(o)
    setOpen(true)
  }

const duplicateOrder = (order: any) => {

  router.push(
    `/don-hang/tao-moi?mode=duplicate&id=${order.id}`
  )

}

  const totalRevenue =
  filtered.reduce(
    (sum, o) =>
      sum + Number(o.total_amount || 0),
    0
  )

const paidRevenue =
  filtered
    .filter(
      (o) =>
        o.payment_status === 'paid'
    )
    .reduce(
      (sum, o) =>
        sum +
        Number(o.total_amount || 0),
      0
    )

const unpaidRevenue =
  filtered
    .filter(
      (o) =>
        o.payment_status !== 'paid'
    )
    .reduce(
      (sum, o) =>
        sum +
        Number(o.total_amount || 0),
      0
    )

  return (
    <PageShell title="Danh sách đơn hàng">
      <div className="w-full min-w-0 overflow-x-hidden bg-[#071018]">

        {/* PAGE HEADER */}
        <PageHeading
          title="Orders"
          description={`Manage ${orders.length} orders`}
          actions={
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <Button
                variant="outline"
                className="h-10 w-full px-3 text-xs sm:w-auto sm:text-sm"
              >
                <Download data-icon="inline-start" />
                Xuất Excel
              </Button>

              <Link href="/don-hang/tao-moi" className="w-full sm:w-auto">
                <Button className="h-10 w-full px-3 text-xs sm:text-sm">
                  <Plus data-icon="inline-start" />
                  Tạo đơn hàng
                </Button>
              </Link>
            </div>
          }
        />

        {/* KPI */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
          <Card className="min-w-0">
            <CardContent className="p-3 sm:p-5">
              <p className="text-xs text-slate-400 sm:text-sm">Tổng đơn</p>
              <h2 className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
                {activeOrders.length}
              </h2>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="p-3 sm:p-5">
              <p className="text-xs text-slate-400 sm:text-sm">Tổng giá trị</p>
              <h2 className="mt-1 truncate text-lg font-bold sm:mt-2 sm:text-3xl">
                {formatVND(
                  activeOrders.reduce(
                    (sum, o) => sum + Number(o.total_amount || 0),
                    0
                  )
                )}
              </h2>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="p-3 sm:p-5">
              <p className="text-xs text-green-400 sm:text-sm">Đã thu</p>
              <h2 className="mt-1 truncate text-lg font-bold text-green-400 sm:mt-2 sm:text-3xl">
                {formatVND(
                  activeOrders.reduce(
                    (sum, o) => sum + Number(o.paid_amount || 0),
                    0
                  )
                )}
              </h2>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="p-3 sm:p-5">
              <p className="text-xs text-red-400 sm:text-sm">Công nợ</p>
              <h2 className="mt-1 truncate text-lg font-bold text-red-400 sm:mt-2 sm:text-3xl">
                {formatVND(
                  activeOrders.reduce(
                    (sum, o) => sum + Number(o.remaining_amount || 0),
                    0
                  )
                )}
              </h2>
            </CardContent>
          </Card>
        </div>

        {/* FILTERS */}
        <FadeIn>
          <Card className="mb-4 overflow-hidden">
            <CardContent className="grid min-w-0 gap-2 p-3 sm:gap-3 sm:p-4 lg:grid-cols-12 lg:items-center">
              <div className="relative min-w-0 lg:col-span-5">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã đơn hoặc tên khách..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-10 w-full pl-9 text-xs sm:h-11 sm:text-sm"
                />
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-2 lg:col-span-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="h-10 min-w-0 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 text-[11px] text-white outline-none focus:border-cyan-500 sm:h-11 sm:px-3 sm:text-sm"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="h-10 min-w-0 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 text-[11px] text-white outline-none focus:border-cyan-500 sm:h-11 sm:px-3 sm:text-sm"
                />
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-2 lg:col-span-4">
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-10 min-w-0 w-full text-[11px] sm:h-11 sm:text-sm">
                    <Filter className="size-3.5 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(
                        (s) => (
                          <SelectItem key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
                          </SelectItem>
                        )
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select
                  value={paymentFilter}
                  onValueChange={(value) => {
                    setPaymentFilter(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-10 min-w-0 w-full text-[11px] sm:h-11 sm:text-sm">
                    <SelectValue placeholder="Thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thanh toán</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* ORDER LIST */}
        <FadeIn delay={0.05}>
          <Card className="overflow-hidden border-slate-800/80 bg-[#0b141d] shadow-none">
            <CardContent className="p-0">

              {/* MOBILE UI
                  Chỉ thay cách hiển thị.
                  Toàn bộ process/status/cancel/detail/copy vẫn giữ nguyên. */}
              <div className="block sm:hidden">
                {paginatedOrders.map((o) => {
                  const debt = Math.max(
                    Number(o.total_amount || 0) -
                      Number(o.paid_amount || 0),
                    0
                  )

                  return (
                    <div
                      key={o.id}
                      onClick={() => openOrder(o)}
                      className="border-b border-slate-800 p-3 last:border-b-0 active:bg-slate-900/80"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="break-all font-mono text-[10px] font-semibold text-cyan-400">
                            {o.order_code}
                          </div>

                          <div className="mt-1 flex min-w-0 items-center gap-2">
                            <div className="min-w-0 truncate text-sm font-semibold text-white">
                              {o.customers?.full_name || 'Khách lẻ'}
                            </div>

                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]",
                                o.customers?.customer_source === "FB"
                                  ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                                  : o.customers?.customer_source === "TikTok"
                                  ? "border-pink-500/25 bg-pink-500/10 text-pink-300"
                                  : o.customers?.customer_source === "Zalo"
                                  ? "border-sky-500/25 bg-sky-500/10 text-sky-300"
                                  : "border-slate-600 bg-slate-800/70 text-slate-300"
                              )}
                            >
                              {o.customers?.customer_source || "Website"}
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] text-slate-500">
                            {o.order_items?.length || 0} SP ·{' '}
                            {formatDateTime(o.created_at)}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-base font-bold text-white">
                            {formatVND(o.total_amount)}
                          </div>

                          <div className="mt-0.5 text-[10px] font-medium text-green-400">
                            Thu: {formatVND(Number(o.paid_amount || 0))}
                          </div>

                          <div className="text-[10px] font-medium text-red-400">
                            Nợ: {formatVND(debt)}
                          </div>
                        </div>
                      </div>

                      {/* Status — GIỮ NGUYÊN PROCESS */}
                      <div className="mt-3">
                        <Select
                          value={o.status}
                          onValueChange={async (value) => {
                            if (
                              value === 'cancelled' &&
                              o.status !== 'cancelled'
                            ) {
                              for (const item of o.order_items || []) {
                                const { data: product } = await supabase
                                  .from('products')
                                  .select('*')
                                  .eq('id', item.product_id)
                                  .single()

                                if (!product) continue

                                await supabase
                                  .from('products')
                                  .update({
                                    stock_quantity:
                                      product.stock_quantity + item.quantity,
                                  })
                                  .eq('id', item.product_id)

                                await supabase
                                  .from('inventory_transactions')
                                  .insert({
                                    product_id: item.product_id,
                                    sku: item.sku,
                                    transaction_type: 'RETURN',
                                    quantity: item.quantity,
                                    stock_after:
                                      product.stock_quantity + item.quantity,
                                    reference_type: 'ORDER_CANCEL',
                                    reference_id: o.order_code,
                                    created_by: 'ADMIN',
                                    note: `Hủy đơn ${o.order_code}`,
                                  })
                              }
                            }

                            await supabase
                              .from('orders')
                              .update({
                                status: value,
                              })
                              .eq('id', o.id)

                            loadOrders()
                          }}
                        >
                          <SelectTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="h-10 w-full border-slate-700 bg-slate-900 text-xs"
                          >
                            <span className={cn(
                              "flex items-center gap-2 truncate font-medium",
                              ORDER_STATUS_UI[o.status]?.text || "text-slate-300"
                            )}>
                              <span
                                className={cn(
                                  "size-1.5 shrink-0 rounded-full",
                                  ORDER_STATUS_UI[o.status]?.dot || "bg-slate-400"
                                )}
                              />
                              {ORDER_STATUS_UI[o.status]?.label || o.status}
                            </span>
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="pending">
                              <span className="flex items-center gap-2 text-amber-300">
                                <span className="size-1.5 rounded-full bg-amber-400" />
                                Chờ xác nhận
                              </span>
                            </SelectItem>
                            <SelectItem value="processing">
                              <span className="flex items-center gap-2 text-sky-300">
                                <span className="size-1.5 rounded-full bg-sky-400" />
                                Đang xử lý
                              </span>
                            </SelectItem>
                            <SelectItem value="shipping">
                              <span className="flex items-center gap-2 text-violet-300">
                                <span className="size-1.5 rounded-full bg-violet-400" />
                                Đang giao
                              </span>
                            </SelectItem>
                            <SelectItem value="completed">
                              <span className="flex items-center gap-2 text-emerald-300">
                                <span className="size-1.5 rounded-full bg-emerald-400" />
                                Hoàn thành
                              </span>
                            </SelectItem>
                            <SelectItem value="cancelled">
                              <span className="flex items-center gap-2 text-rose-300">
                                <span className="size-1.5 rounded-full bg-rose-400" />
                                Đã hủy
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* ACTIONS — GIỮ NGUYÊN */}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openOrder(o)
                          }}
                          className="h-9 rounded-lg bg-cyan-500/10 px-3 text-xs font-semibold text-cyan-400 active:bg-cyan-500/20"
                        >
                          👁 Xem
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateOrder(o)
                          }}
                          className="h-9 rounded-lg bg-yellow-500/10 px-3 text-xs font-semibold text-yellow-400 active:bg-yellow-500/20"
                        >
                          📄 Copy
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* DESKTOP UI — GIỮ BẢNG CŨ */}
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Order</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Customer</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Source</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Items</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        Total
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Payment</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Status</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Created</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedOrders.map((o) => (
                      <TableRow
                        key={o.id}
                        onClick={() => openOrder(o)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-mono">
                          {o.order_code}
                        </TableCell>

                        <TableCell className="max-w-[190px]">
                          <div className="truncate font-medium">
                            {o.customers?.full_name || 'Khách lẻ'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                              o.customers?.customer_source === "FB"
                                ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                                : o.customers?.customer_source === "TikTok"
                                ? "border-pink-500/25 bg-pink-500/10 text-pink-300"
                                : o.customers?.customer_source === "Zalo"
                                ? "border-sky-500/25 bg-sky-500/10 text-sky-300"
                                : "border-slate-600 bg-slate-800/70 text-slate-300"
                            )}
                          >
                            {o.customers?.customer_source || "Website"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {o.order_items?.length || 0} SP
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {formatVND(o.total_amount)}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-green-500">
                              Thu:{' '}
                              {formatVND(Number(o.paid_amount || 0))}
                            </div>
                            <div className="text-xs font-medium text-red-500">
                              Nợ:{' '}
                              {formatVND(
                                Math.max(
                                  Number(o.total_amount || 0) -
                                    Number(o.paid_amount || 0),
                                  0
                                )
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* STATUS — GIỮ NGUYÊN PROCESS */}
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Select
                            value={o.status}
                            onValueChange={async (value) => {
                              if (
                                value === 'cancelled' &&
                                o.status !== 'cancelled'
                              ) {
                                for (const item of o.order_items || []) {
                                  const { data: product } = await supabase
                                    .from('products')
                                    .select('*')
                                    .eq('id', item.product_id)
                                    .single()

                                  if (!product) continue

                                  await supabase
                                    .from('products')
                                    .update({
                                      stock_quantity:
                                        product.stock_quantity +
                                        item.quantity,
                                    })
                                    .eq('id', item.product_id)

                                  await supabase
                                    .from('inventory_transactions')
                                    .insert({
                                      product_id: item.product_id,
                                      sku: item.sku,
                                      transaction_type: 'RETURN',
                                      quantity: item.quantity,
                                      stock_after:
                                        product.stock_quantity +
                                        item.quantity,
                                      reference_type: 'ORDER_CANCEL',
                                      reference_id: o.order_code,
                                      created_by: 'ADMIN',
                                      note: `Hủy đơn ${o.order_code}`,
                                    })
                                }
                              }

                              await supabase
                                .from('orders')
                                .update({
                                  status: value,
                                })
                                .eq('id', o.id)

                              loadOrders()
                            }}
                          >
                            <SelectTrigger className="h-8 w-[150px] border-0 bg-slate-800">
                              <span className={cn(
                                "flex items-center gap-2 text-sm font-medium",
                                ORDER_STATUS_UI[o.status]?.text || "text-slate-300"
                              )}>
                                <span
                                  className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    ORDER_STATUS_UI[o.status]?.dot || "bg-slate-400"
                                  )}
                                />
                                {ORDER_STATUS_UI[o.status]?.label || o.status}
                              </span>
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="pending">
                                🟡 Chờ xác nhận
                              </SelectItem>
                              <SelectItem value="processing">
                                🔵 Đang xử lý
                              </SelectItem>
                              <SelectItem value="shipping">
                                🟣 Đang giao
                              </SelectItem>
                              <SelectItem value="completed">
                                🟢 Hoàn thành
                              </SelectItem>
                              <SelectItem value="cancelled">
                                🔴 Đã hủy
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          {formatDateTime(o.created_at)}
                        </TableCell>

                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openOrder(o)}
                              className="rounded-lg px-3 py-1.5 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              👁 Xem
                            </button>

                            <button
                              type="button"
                              onClick={() => duplicateOrder(o)}
                              className="rounded-lg px-3 py-1.5 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              📄 Copy
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* EMPTY */}
              {filtered.length === 0 && (
                <Empty className="py-12 sm:py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search />
                    </EmptyMedia>
                    <EmptyTitle>Không tìm thấy đơn hàng</EmptyTitle>
                    <EmptyDescription>
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}

              {/* PAGINATION — process giữ nguyên, chỉ responsive UI */}
              <div className="flex items-center justify-center gap-2 border-t border-slate-800 p-3 sm:p-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ←
                </Button>

                <span className="text-xs text-slate-400 sm:hidden">
                  Trang {currentPage}/{Math.max(totalPages, 1)}
                </span>

                <div className="hidden items-center gap-2 sm:flex">
                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={
                          currentPage === i + 1
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    currentPage === totalPages ||
                    totalPages === 0
                  }
                  onClick={() =>
                    setCurrentPage(currentPage + 1)
                  }
                >
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <OrderDetailSheet
          order={selected}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </PageShell>
  )
}
