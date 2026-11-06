'use client'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, Filter, Download, ExternalLink, Wallet, ClipboardList, BadgeCheck, HandCoins, ChartLine, TrendingUp, TrendingDown, Minus } from 'lucide-react'
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
import { formatVND } from '@/lib/format'

/**
 * Chuẩn hóa timestamp từ Supabase và hiển thị theo giờ Việt Nam.
 * Timestamp có timezone được giữ nguyên; timestamp không có timezone
 * được hiểu là UTC (quy ước thông thường của cột created_at timestamptz).
 */
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'

function parseOrderDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const rawValue = value.trim()
  if (!rawValue) return null

  // Hỗ trợ Z, +07, +0700 và +07:00.
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(rawValue)
  const normalizedValue = hasTimezone ? rawValue : `${rawValue.replace(' ', 'T')}Z`
  const date = new Date(normalizedValue)

  return Number.isNaN(date.getTime()) ? null : date
}

function formatVietnamDateTime(value: string | Date | null | undefined) {
  const date = parseOrderDate(value)
  if (!date) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(date)
}

function formatCompactVietnamDateTime(value: string | Date | null | undefined) {
  const date = parseOrderDate(value)
  if (!date) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    hour12: false,
  }).format(date)
}

function getVietnamDateKey(value: string | Date | null | undefined) {
  const date = parseOrderDate(value)
  if (!date) return ''

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value || ''

  return `${part('year')}-${part('month')}-${part('day')}`
}

function getVietnamTodayKey() {
  return getVietnamDateKey(new Date())
}

function shiftDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}



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
  waiting_stock: {
    label: 'Nợ hàng',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/25',
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
    bg: 'bg-emerald-500/15 border-emerald-400/30',
  },
  cancelled: {
    label: 'Đã hủy',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
}


function getDisplayOrderStatus(order: any): string {
  // Nợ hàng là trạng thái fulfillment, không phải order.status.
  if (order?.fulfillment_status === 'waiting_stock') return 'waiting_stock'
  return order?.status || 'pending'
}

function OrderStatusIcon({ status }: { status: string }) {
  const common = {
    width: 13,
    height: 13,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (status) {
    case 'pending':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'processing':
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M18.36 5.64l-2.12 2.12M7.76 16.24l-2.12 2.12" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    case 'waiting_stock':
      return (
        <svg {...common}>
          <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
          <path d="M4.5 7.8 12 12l7.5-4.2M12 12v8.5" />
          <path d="M16.5 3.8v4" />
        </svg>
      )
    case 'shipping':
      return (
        <svg {...common}>
          <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
          <circle cx="7.5" cy="18" r="1.5" />
          <circle cx="17.5" cy="18" r="1.5" />
        </svg>
      )
    case 'completed':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      )
    case 'cancelled':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6m0-6-6 6" />
        </svg>
      )
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>
  }
}

function shiftDateByMonths(dateKey: string, months: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const targetMonthStart = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth() + 1,
      0
    )
  ).getUTCDate()

  const safeDay = Math.min(day, lastDayOfTargetMonth)
  const shifted = new Date(
    Date.UTC(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth(),
      safeDay
    )
  )

  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function KpiPeriodChange({
  current,
  previous,
  inverse = false,
  enabled,
}: {
  current: number
  previous: number
  inverse?: boolean
  enabled: boolean
}) {
  if (!enabled) {
    return (
      <p className="mt-2 text-[10px] leading-4 text-slate-500 sm:text-xs">
        Chọn đủ ngày để so sánh
      </p>
    )
  }

  if (previous === 0 && current > 0) {
    return (
      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-cyan-300 sm:text-xs">
        <TrendingUp className="size-3.5" />
        Mới phát sinh
      </div>
    )
  }

  const change = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100
  const roundedChange = Math.abs(change).toLocaleString('vi-VN', {
    maximumFractionDigits: 1,
  })
  const isNeutral = Math.abs(change) < 0.05
  const isIncrease = change > 0
  const isPositive = inverse ? !isIncrease : isIncrease
  const colorClass = isNeutral
    ? 'text-slate-400'
    : isPositive
      ? 'text-emerald-400'
      : 'text-rose-400'
  const TrendIcon = isNeutral ? Minus : isIncrease ? TrendingUp : TrendingDown

  return (
    <div className={cn('mt-2 flex min-w-0 items-center gap-1 text-[10px] font-semibold sm:text-xs', colorClass)}>
      <TrendIcon className="size-3.5 shrink-0" />
      <span>{isIncrease ? '+' : isNeutral ? '' : '-'}{roundedChange}%</span>
      <span className="truncate font-normal text-slate-500">so với cùng kỳ tháng trước</span>
    </div>
  )
}

export function OrdersListClient() {

  const router = useRouter()
  
const [query, setQuery] = useState('')
const [status, setStatus] = useState<string>('all')

const [fromDate, setFromDate] =
  useState('')

const [toDate, setToDate] =
  useState('')

const [datePreset, setDatePreset] =
  useState<'today' | 'yesterday' | '7d' | '14d' | '30d' | 'custom'>('custom')

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

const applyDatePreset = (preset: 'today' | 'yesterday' | '7d' | '14d' | '30d' | 'custom') => {
  setDatePreset(preset)
  setCurrentPage(1)

  if (preset === 'custom') return

  const today = getVietnamTodayKey()
  let from = today
  let to = today

  if (preset === 'yesterday') {
    from = shiftDateKey(today, -1)
    to = from
  } else if (preset === '7d') {
    from = shiftDateKey(today, -6)
  } else if (preset === '14d') {
    from = shiftDateKey(today, -13)
  } else if (preset === '30d') {
    from = shiftDateKey(today, -29)
  }

  setFromDate(from)
  setToDate(to)
}

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

    if (status === 'waiting_stock') {
      if (o.fulfillment_status !== 'waiting_stock') return false
    } else if (status !== 'all' && o.status !== status) {
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

  // Lọc theo ngày lịch Việt Nam, không phụ thuộc timezone của trình duyệt.
  const orderDateKey = getVietnamDateKey(o.created_at)

  if (!orderDateKey) return false

  if (fromDate && orderDateKey < fromDate) {
    return false
  }

  if (toDate && orderDateKey > toDate) {
    return false
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

// So sánh cùng khoảng ngày của tháng trước.
// Chỉ bật khi người dùng đã chọn đủ ngày bắt đầu và kết thúc.
const comparisonEnabled = Boolean(fromDate && toDate)
const previousFromDate = comparisonEnabled
  ? shiftDateByMonths(fromDate, -1)
  : ''
const previousToDate = comparisonEnabled
  ? shiftDateByMonths(toDate, -1)
  : ''

const previousPeriodOrders = useMemo(() => {
  if (!comparisonEnabled) return []

  return orders.filter((o) => {
    if (o.status === 'cancelled') return false

    if (status === 'waiting_stock') {
      if (o.fulfillment_status !== 'waiting_stock') return false
    } else if (status !== 'all' && o.status !== status) {
      return false
    }

    if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) {
      return false
    }

    if (
      query &&
      !(
        String(o.order_code || '').toLowerCase().includes(query.toLowerCase()) ||
        String(o.customers?.full_name || '').toLowerCase().includes(query.toLowerCase())
      )
    ) {
      return false
    }

    const orderDateKey = getVietnamDateKey(o.created_at)
    return Boolean(
      orderDateKey &&
      orderDateKey >= previousFromDate &&
      orderDateKey <= previousToDate
    )
  })
}, [
  orders,
  comparisonEnabled,
  previousFromDate,
  previousToDate,
  status,
  paymentFilter,
  query,
])

const currentKpiValues = {
  orders: activeOrders.length,
  total: activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
  paid: activeOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0),
  debt: activeOrders.reduce((sum, o) => sum + Number(
    o.remaining_amount ?? Math.max(
      Number(o.total_amount || 0) - Number(o.paid_amount || 0),
      0
    )
  ), 0),
  average: activeOrders.length > 0
    ? activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) / activeOrders.length
    : 0,
}

const previousKpiValues = {
  orders: previousPeriodOrders.length,
  total: previousPeriodOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
  paid: previousPeriodOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0),
  debt: previousPeriodOrders.reduce((sum, o) => sum + Number(
    o.remaining_amount ?? Math.max(
      Number(o.total_amount || 0) - Number(o.paid_amount || 0),
      0
    )
  ), 0),
  average: previousPeriodOrders.length > 0
    ? previousPeriodOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) / previousPeriodOrders.length
    : 0,
}

const comparisonCaption = comparisonEnabled
  ? `So với ${previousFromDate.split('-').reverse().join('/')} – ${previousToDate.split('-').reverse().join('/')}`
  : 'Chọn ngày bắt đầu và kết thúc để so sánh'

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

        {/* KPI — GOLD THEME */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-3 lg:grid-cols-3 2xl:grid-cols-5">
          <Card className="relative min-w-0 overflow-hidden border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.10] via-[#101923] to-[#0b141d] shadow-[0_8px_24px_rgba(34,211,238,0.045)]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-300/80 via-cyan-400 to-cyan-500/20" />
            <CardContent className="relative p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-cyan-100/75 sm:text-sm">Tổng đơn</p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300 sm:size-9">
                  <ClipboardList className="size-4 sm:size-[18px]" strokeWidth={1.9} />
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-cyan-300 tabular-nums sm:mt-3 sm:text-3xl">
                {activeOrders.length.toLocaleString('vi-VN')}
              </h2>
              <p className="mt-1 text-[10px] text-cyan-100/45 sm:text-xs">Số đơn chưa bị hủy</p>
              <KpiPeriodChange
                current={currentKpiValues.orders}
                previous={previousKpiValues.orders}
                enabled={comparisonEnabled}
              />
            </CardContent>
          </Card>

          <Card className="relative min-w-0 overflow-hidden border-violet-400/20 bg-gradient-to-br from-violet-400/[0.10] via-[#101923] to-[#0b141d] shadow-[0_8px_24px_rgba(139,92,246,0.045)]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-300/80 via-violet-400 to-violet-500/20" />
            <CardContent className="relative p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-violet-100/75 sm:text-sm">Giá trị đơn TB</p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-300 sm:size-9">
                  <ChartLine className="size-4 sm:size-[18px]" strokeWidth={1.9} />
                </span>
              </div>
              <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-violet-300 tabular-nums sm:mt-3 sm:text-3xl">
                {formatVND(currentKpiValues.average)}
              </h2>
              <p className="mt-1 text-[10px] text-violet-100/45 sm:text-xs">Tổng giá trị chia số đơn</p>
              <KpiPeriodChange
                current={currentKpiValues.average}
                previous={previousKpiValues.average}
                enabled={comparisonEnabled}
              />
            </CardContent>
          </Card>

          <Card className="relative min-w-0 overflow-hidden border-amber-400/20 bg-gradient-to-br from-amber-400/[0.10] via-[#101923] to-[#0b141d] shadow-[0_8px_24px_rgba(245,158,11,0.045)]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-300/80 via-amber-400 to-amber-500/20" />
            <CardContent className="relative p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-amber-100/75 sm:text-sm">Tổng giá trị</p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-300 sm:size-9">
                  <Wallet className="size-4 sm:size-[18px]" strokeWidth={1.9} />
                </span>
              </div>
              <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-amber-300 tabular-nums sm:mt-3 sm:text-3xl">
                {formatVND(activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0))}
              </h2>
              <p className="mt-1 text-[10px] text-amber-100/45 sm:text-xs">Tổng giá trị đơn hàng</p>
              <KpiPeriodChange
                current={currentKpiValues.total}
                previous={previousKpiValues.total}
                enabled={comparisonEnabled}
              />
            </CardContent>
          </Card>

          <Card className="relative min-w-0 overflow-hidden border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.10] via-[#101923] to-[#0b141d] shadow-[0_8px_24px_rgba(16,185,129,0.045)]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-300/80 via-emerald-400 to-emerald-500/20" />
            <CardContent className="relative p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-emerald-100/75 sm:text-sm">Đã thu</p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300 sm:size-9">
                  <BadgeCheck className="size-4 sm:size-[18px]" strokeWidth={1.9} />
                </span>
              </div>
              <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-emerald-300 tabular-nums sm:mt-3 sm:text-3xl">
                {formatVND(activeOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0))}
              </h2>
              <p className="mt-1 text-[10px] text-emerald-100/45 sm:text-xs">Tổng tiền khách đã thanh toán</p>
              <KpiPeriodChange
                current={currentKpiValues.paid}
                previous={previousKpiValues.paid}
                enabled={comparisonEnabled}
              />
            </CardContent>
          </Card>

          <Card className="relative min-w-0 overflow-hidden border-rose-400/20 bg-gradient-to-br from-rose-400/[0.10] via-[#101923] to-[#0b141d] shadow-[0_8px_24px_rgba(244,63,94,0.045)]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-rose-300/80 via-rose-400 to-rose-500/20" />
            <CardContent className="relative p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-rose-100/75 sm:text-sm">Công nợ</p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-300/10 text-rose-300 sm:size-9">
                  <HandCoins className="size-4 sm:size-[18px]" strokeWidth={1.9} />
                </span>
              </div>
              <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-rose-300 tabular-nums sm:mt-3 sm:text-3xl">
                {formatVND(activeOrders.reduce((sum, o) => sum + Number(o.remaining_amount || 0), 0))}
              </h2>
              <p className="mt-1 text-[10px] text-rose-100/45 sm:text-xs">Tổng số tiền khách còn nợ</p>
              <KpiPeriodChange
                current={currentKpiValues.debt}
                previous={previousKpiValues.debt}
                inverse
                enabled={comparisonEnabled}
              />
            </CardContent>
          </Card>
        </div>
        <p className="-mt-2 mb-4 px-1 text-[10px] text-slate-500 sm:-mt-4 sm:mb-5 sm:text-xs">
          {comparisonCaption}
        </p>

        {/* FILTERS */}
        <FadeIn>
          <Card className="mb-4 overflow-hidden">
            <CardContent className="space-y-3 p-3 sm:p-4">
              <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(220px,1fr)_auto_auto] lg:items-center">
                <div className="relative min-w-0">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo mã đơn hoặc tên khách..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-10 w-full pl-9 text-xs sm:h-10 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:flex lg:items-center">
                  {([
                    ['today', 'Hôm nay'],
                    ['yesterday', 'Hôm qua'],
                    ['7d', '7 ngày'],
                    ['14d', '14 ngày'],
                    ['30d', '30 ngày'],
                    ['custom', 'Tùy chọn'],
                  ] as const).map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={datePreset === value ? 'default' : 'outline'}
                      onClick={() => applyDatePreset(value)}
                      className={cn(
                        'h-8 min-w-0 px-2 text-[10px] sm:px-2.5 sm:text-xs',
                        datePreset === value
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      )}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-2 lg:w-[300px]">
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      setStatus(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9 min-w-0 w-full px-2 text-[11px] sm:text-xs">
                      <Filter className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate text-left">
                        {status === 'all'
                          ? 'Tất cả trạng thái'
                          : status === 'waiting_stock'
                            ? 'Nợ hàng'
                            : ORDER_STATUS_LABELS[status as OrderStatus] || 'Trạng thái'}
                      </span>
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
                        <SelectItem value="waiting_stock">Nợ hàng</SelectItem>
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
                    <SelectTrigger className="h-9 min-w-0 w-full px-2 text-[11px] sm:text-xs">
                      <span className="min-w-0 truncate text-left">
                        {paymentFilter === 'all'
                          ? 'Tất cả thanh toán'
                          : paymentFilter === 'paid'
                            ? 'Đã thanh toán'
                            : 'Chưa thanh toán'}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thanh toán</SelectItem>
                      <SelectItem value="paid">Đã thanh toán</SelectItem>
                      <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {datePreset === 'custom' && (
                <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 sm:flex-row sm:items-center">
                  <span className="text-[11px] font-medium text-slate-400">
                    Khoảng thời gian
                  </span>
                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:max-w-[420px]">
                    <input
                      type="date"
                      aria-label="Từ ngày"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value)
                        setCurrentPage(1)
                      }}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="h-9 min-w-0 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 text-[11px] text-white outline-none focus:border-cyan-500 sm:px-3 sm:text-xs"
                    />
                    <input
                      type="date"
                      aria-label="Đến ngày"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value)
                        setCurrentPage(1)
                      }}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="h-9 min-w-0 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 text-[11px] text-white outline-none focus:border-cyan-500 sm:px-3 sm:text-xs"
                    />
                  </div>
                </div>
              )}
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
                  const displayStatus = getDisplayOrderStatus(o)
                  const debt = Math.max(
                    Number(o.total_amount || 0) - Number(o.paid_amount || 0),
                    0
                  )
                  const isFullyPaid =
                    Number(o.total_amount || 0) > 0 &&
                    Number(o.paid_amount || 0) >= Number(o.total_amount || 0)

                  return (
                    <div
                      key={o.id}
                      className="border-b border-slate-800/90 p-3 last:border-b-0"
                    >
                      {/* Order identity + total */}
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div
                            title={o.order_code || ''}
                            className="truncate font-mono text-[10px] font-bold tracking-wide text-cyan-400"
                          >
                            {o.order_code || '—'}
                          </div>

                          <div className="mt-1.5 flex min-w-0 items-center gap-2">
                            <div className="min-w-0 truncate text-[13px] font-bold leading-5 text-slate-100">
                              {o.customers?.full_name || 'Khách lẻ'}
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold leading-none",
                                o.customers?.customer_source === "FB" ||
                                o.customers?.customer_source === "Facebook" ||
                                o.customers?.customer_source === "Facebook Ads"
                                  ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                                  : o.customers?.customer_source === "TikTok"
                                  ? "border-pink-500/25 bg-pink-500/10 text-pink-300"
                                  : o.customers?.customer_source === "Zalo"
                                  ? "border-sky-500/25 bg-sky-500/10 text-sky-300"
                                  : "border-slate-600/70 bg-slate-800/70 text-slate-300"
                              )}
                            >
                              {o.customers?.customer_source === "Facebook" ||
                              o.customers?.customer_source === "Facebook Ads"
                                ? "FB"
                                : o.customers?.customer_source === "TikTok"
                                ? "TT"
                                : o.customers?.customer_source === "Zalo"
                                ? "ZL"
                                : o.customers?.customer_source === "FB"
                                ? "FB"
                                : o.customers?.customer_source === "Website"
                                ? "WEB"
                                : (o.customers?.customer_source || "WEB").toUpperCase()}
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] leading-4 text-slate-500">
                            {o.order_items?.length || 0} SP
                            <span className="mx-1.5 text-slate-700">·</span>
                            {formatCompactVietnamDateTime(o.created_at)}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-[15px] font-extrabold leading-5 tracking-tight text-white tabular-nums">
                            {formatVND(o.total_amount)}
                          </div>
                        </div>
                      </div>

                      {/* Payment summary — two balanced columns */}
                      <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl border border-slate-800/90 bg-slate-900/55 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
                            Đã thu
                          </div>
                          <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] font-bold tabular-nums text-emerald-400">
                            {isFullyPaid && (
                              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none">
                                <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18" />
                                <path d="m4.5 8.1 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            <span className="truncate">{formatVND(Number(o.paid_amount || 0))}</span>
                          </div>
                        </div>
                        <div className="min-w-0 border-l border-slate-800 pl-3">
                          <div className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
                            Còn nợ
                          </div>
                          <div className="mt-0.5 truncate text-[11px] font-bold tabular-nums text-rose-400">
                            {formatVND(debt)}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="mt-2.5">
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
                              .update({ status: value })
                              .eq('id', o.id)

                            loadOrders()
                          }}
                        >
                          <SelectTrigger
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "h-9 w-full rounded-lg border bg-slate-900/70 px-3 text-[11px] shadow-none",
                              ORDER_STATUS_UI[displayStatus]?.bg || "border-slate-700",
                            )}
                          >
                            <span className={cn(
                              "flex min-w-0 items-center gap-2 whitespace-nowrap font-semibold",
                              ORDER_STATUS_UI[displayStatus]?.text || "text-slate-300"
                            )}>
                              <span className="inline-flex shrink-0 items-center justify-center">
                                <OrderStatusIcon status={displayStatus} />
                              </span>
                              {ORDER_STATUS_UI[displayStatus]?.label || o.status}
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

                      {/* Actions — centered as one compact group */}
                      <div className="mt-2.5 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openOrder(o)
                          }}
                          aria-label="Xem chi tiết đơn hàng"
                          title="Xem chi tiết đơn hàng"
                          className="flex size-9 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-400 transition-colors hover:bg-cyan-500/20 active:bg-cyan-500/25"
                        >
                          <ExternalLink className="size-4" strokeWidth={2} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateOrder(o)
                          }}
                          aria-label="Nhân bản đơn hàng"
                          title="Nhân bản đơn hàng"
                          className="flex size-9 items-center justify-center rounded-xl border border-yellow-500/25 bg-yellow-500/10 text-yellow-400 transition-colors hover:bg-yellow-500/20 active:bg-yellow-500/25"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="8" y="8" width="12" height="12" rx="2" />
                            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* DESKTOP UI — GIỮ BẢNG CŨ */}
              <div className="hidden overflow-x-auto sm:block">
                <Table className="w-full table-fixed">
                  <colgroup>
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Mã đơn</TableHead>
                      <TableHead className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Khách hàng</TableHead>
                      <TableHead className="whitespace-nowrap px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Nguồn</TableHead>
                      <TableHead className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Sản phẩm</TableHead>
                      <TableHead className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tổng tiền</TableHead>
                      <TableHead className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Thanh toán</TableHead>
                      <TableHead className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Trạng thái</TableHead>
                      <TableHead className="whitespace-nowrap px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tạo lúc</TableHead>
                      <TableHead className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedOrders.map((o) => {
                      const displayStatus = getDisplayOrderStatus(o)
                      return (
                      <TableRow key={o.id}>
                        <TableCell className="overflow-hidden px-2 text-center font-mono text-[10px]">
                          <span
                            title={o.order_code || ''}
                            className="inline-block max-w-full truncate align-middle"
                          >
                            {o.order_code || '—'}
                          </span>
                        </TableCell>

                        <TableCell className="overflow-hidden px-2 text-center">
                          <div className="truncate font-medium">
                            {o.customers?.full_name || 'Khách lẻ'}
                          </div>
                        </TableCell>

                        <TableCell className="px-2 text-center">
                          <span
                            title={o.customers?.customer_source || 'Website'}
                            className={cn(
                              "inline-flex min-w-[38px] justify-center rounded-full border px-1.5 py-1 text-[9px] font-bold uppercase tracking-normal",
                              o.customers?.customer_source === "FB"
                                ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                                : o.customers?.customer_source === "TikTok"
                                ? "border-pink-500/25 bg-pink-500/10 text-pink-300"
                                : o.customers?.customer_source === "Zalo"
                                ? "border-sky-500/25 bg-sky-500/10 text-sky-300"
                                : "border-slate-600 bg-slate-800/70 text-slate-300"
                            )}
                          >
                            {o.customers?.customer_source === 'Facebook' || o.customers?.customer_source === 'Facebook Ads' ? 'FB' :
                             o.customers?.customer_source === 'Website' ? 'WEB' :
                             o.customers?.customer_source === 'TikTok' ? 'TT' :
                             o.customers?.customer_source === 'Zalo' ? 'ZL' :
                             o.customers?.customer_source === 'FB' ? 'FB' :
                             (o.customers?.customer_source || 'WEB').slice(0, 3).toUpperCase()}
                          </span>
                        </TableCell>

                        <TableCell className="px-2 text-center">
                          {o.order_items?.length || 0} SP
                        </TableCell>

                        <TableCell className="px-2 text-center font-semibold">
                          {formatVND(o.total_amount)}
                        </TableCell>

                        <TableCell className="px-2 text-center">
                          <div className="mx-auto flex w-full max-w-[150px] min-w-0 flex-col gap-1 rounded-lg border border-slate-800/80 bg-slate-900/45 px-2 py-1.5 text-left">
                            <div className="flex items-center justify-between gap-2 text-xs leading-5">
                              <span className="shrink-0 text-slate-500">Đã thu</span>
                              <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap text-right text-[12px] font-bold tabular-nums text-emerald-400">
                                {Number(o.total_amount || 0) > 0 && Number(o.paid_amount || 0) >= Number(o.total_amount || 0) && (
                                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none">
                                    <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18" />
                                    <path d="m4.5 8.1 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                                {formatVND(Number(o.paid_amount || 0))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-1 text-xs leading-5">
                              <span className="shrink-0 text-slate-500">Còn nợ</span>
                              <span className="whitespace-nowrap text-right text-[12px] font-bold tabular-nums text-rose-400">
                                {formatVND(
                                  Math.max(
                                    Number(o.total_amount || 0) -
                                      Number(o.paid_amount || 0),
                                    0
                                  )
                                )}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* STATUS — GIỮ NGUYÊN PROCESS */}
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 text-center"
                        >
                          <div className="flex justify-center">
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
                            <SelectTrigger
                              className={cn(
                                "h-8 w-[156px] rounded-full border px-2.5 shadow-none focus:ring-1 focus:ring-cyan-500/30",
                                ORDER_STATUS_UI[displayStatus]?.bg || "border-slate-700 bg-slate-800/80"
                              )}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <span className={cn(
                                  "inline-flex shrink-0 items-center justify-center",
                                  ORDER_STATUS_UI[displayStatus]?.text || "text-slate-300"
                                )}>
                                  <OrderStatusIcon status={displayStatus} />
                                </span>
                                <span className={cn(
                                  "whitespace-nowrap text-xs font-semibold",
                                  ORDER_STATUS_UI[displayStatus]?.text || "text-slate-300"
                                )}>
                                  {ORDER_STATUS_UI[displayStatus]?.label || o.status}
                                </span>
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
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-2 text-center text-[11px] tabular-nums">
                          <span title={formatVietnamDateTime(o.created_at)}>
                            {formatCompactVietnamDateTime(o.created_at)}
                          </span>
                        </TableCell>

                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 text-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openOrder(o)}
                              aria-label="Xem chi tiết đơn hàng"
                              title="Xem chi tiết đơn hàng"
                              className="inline-flex size-8 items-center justify-center rounded-md border border-cyan-500/25 bg-cyan-500/10 text-cyan-400 transition-colors hover:bg-cyan-500/20"
                            >
                              <ExternalLink className="size-4" strokeWidth={2} />
                            </button>

                            <button
                              type="button"
                              onClick={() => duplicateOrder(o)}
                              aria-label="Nhân bản đơn hàng"
                              title="Nhân bản đơn hàng"
                              className="inline-flex size-8 items-center justify-center rounded-md border border-yellow-500/25 bg-yellow-500/10 text-yellow-400 transition-colors hover:bg-yellow-500/20"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <rect x="8" y="8" width="12" height="12" rx="2" />
                                <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                              </svg>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      )
                    })}
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
