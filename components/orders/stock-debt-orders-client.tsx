'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'
import { PageShell, PageHeading } from '@/components/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { formatVND, formatDateTime } from '@/lib/format'
import { OrderDetailSheet } from '@/components/orders/order-detail-sheet'

type Risk = 'normal' | 'watch' | 'warning' | 'critical'

function waitingDays(createdAt: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000),
  )
}

function riskOf(days: number, expected?: string | null): Risk {
  if (
    expected &&
    new Date(`${expected}T23:59:59`).getTime() < Date.now()
  ) {
    return 'critical'
  }
  if (days >= 14) return 'critical'
  if (days >= 8) return 'warning'
  if (days >= 4) return 'watch'
  return 'normal'
}

const riskMeta: Record<
  Risk,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  normal: {
    label: 'Theo dõi',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  watch: {
    label: 'Cần gọi',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  warning: {
    label: 'Cảnh báo',
    dot: 'bg-orange-400',
    text: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  critical: {
    label: 'Nguy hiểm',
    dot: 'bg-red-400',
    text: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
}

const riskOrder: Risk[] = ['normal', 'watch', 'warning', 'critical']

export function StockDebtOrdersClient() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [open, setOpen] = useState(false)

  async function loadOrders() {
    setLoading(true)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          customer_code,
          customer_display_code,
          full_name,
          phone,
          address,
          customer_source,
          customer_note
        ),
        order_items (*)
      `)
      .eq('fulfillment_status', 'waiting_stock')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('LOAD STOCK-DEBT ORDERS ERROR:', error)
      setOrders([])
    } else {
      setOrders(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()

    return orders
      .map((o) => {
        const items = o.order_items || []
        const days = waitingDays(o.created_at)
        return {
          ...o,
          items,
          days,
          risk: riskOf(days, o.expected_stock_date),
        }
      })
      .filter((o) => {
        const textMatch =
          !q ||
          String(o.order_code || '').toLowerCase().includes(q) ||
          String(o.customers?.full_name || '').toLowerCase().includes(q) ||
          String(o.customers?.phone || '').toLowerCase().includes(q) ||
          o.items.some(
            (i: any) =>
              String(i.sku || '').toLowerCase().includes(q) ||
              String(i.product_name || i.name || '')
                .toLowerCase()
                .includes(q),
          )

        return textMatch && (riskFilter === 'all' || o.risk === riskFilter)
      })
  }, [orders, query, riskFilter])

  const customerCount = new Set(
    rows.map((o) => o.customer_id || o.order_code),
  ).size
  const criticalCount = rows.filter((o) => o.risk === 'critical').length
  const warningCount = rows.filter((o) => o.risk === 'warning').length
  const watchCount = rows.filter((o) => o.risk === 'watch').length
  const averageWaiting = rows.length
    ? Math.round(rows.reduce((s, o) => s + o.days, 0) / rows.length)
    : 0
  const totalValue = rows.reduce(
    (s, o) => s + Number(o.total_amount || 0),
    0,
  )
  const oldestOrder = rows.reduce(
    (oldest, o) => (!oldest || o.days > oldest.days ? o : oldest),
    null as any,
  )

  const buckets = [
    ['0–2', 0, 2],
    ['3–5', 3, 5],
    ['6–7', 6, 7],
    ['8–14', 8, 14],
    ['15+', 15, Infinity],
  ].map(([label, min, max]) => ({
    label: String(label),
    count: rows.filter(
      (o) => o.days >= Number(min) && o.days <= Number(max),
    ).length,
  }))

  const maxBucket = Math.max(...buckets.map((b) => b.count), 1)

  async function markReady(order: any) {
    const { error } = await supabase
      .from('orders')
      .update({
        fulfillment_status: 'ready',
        expected_stock_date: null,
      })
      .eq('id', order.id)

    if (error) {
      console.error(error)
      alert('Không thể cập nhật đơn hàng')
      return
    }

    await loadOrders()
  }

  return (
    <PageShell title="Nợ hàng">
      <div className="space-y-5 pb-8">
        {/* HEADER */}
        <PageHeading
          title="Nợ hàng"
          description="Theo dõi các đơn còn thiếu hàng, thời gian khách đã chờ và mức độ cần xử lý."
          actions={
            <Button
              variant="outline"
              onClick={() => void loadOrders()}
              disabled={loading}
              className="border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
          }
        />

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="relative overflow-hidden border-slate-800 bg-[#0e1724] shadow-none">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Đơn đang nợ hàng
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                    {rows.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Đơn đang chờ bổ sung hàng
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                  <Package className="size-5" />
                </div>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-[#0e1724] shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Khách đang chờ
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                    {customerCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Khách có đơn thiếu hàng
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                  <Users className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-[#0e1724] shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Đơn nguy hiểm
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-red-400">
                    {criticalCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Cần ưu tiên xử lý
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <AlertTriangle className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-[#0e1724] to-[#0e1724] shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Giá trị đang treo
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    {formatVND(totalValue)}
                  </p>
                  <p className="mt-1 text-xs text-violet-300">
                    {averageWaiting} ngày chờ trung bình
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                  <ArrowUpRight className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.85fr]">
          <Card className="overflow-hidden border-slate-800 bg-[#0e1724] shadow-none">
            <CardContent className="p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
                    <h3 className="text-sm font-semibold text-white">
                      Tuổi đơn đang nợ hàng
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Phân bổ theo số ngày khách đã phải chờ
                  </p>
                </div>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
                  {rows.length} đơn
                </span>
              </div>

              <div className="space-y-4">
                {buckets.map((b, index) => {
                  const width = b.count
                    ? Math.max((b.count / maxBucket) * 100, 5)
                    : 0

                  return (
                    <div key={b.label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {b.label} ngày
                        </span>
                        <span className="font-semibold text-slate-200">
                          {b.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            index >= 3
                              ? 'from-orange-500 to-red-400'
                              : 'from-violet-600 to-fuchsia-400'
                          } transition-all duration-500`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-[#0e1724] shadow-none">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Mức độ rủi ro
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Ưu tiên xử lý các đơn chờ lâu
                  </p>
                </div>
                <AlertTriangle className="size-4 text-violet-300" />
              </div>

              <div className="space-y-3">
                {riskOrder.map((risk) => {
                  const count = rows.filter((o) => o.risk === risk).length
                  const meta = riskMeta[risk]
                  const percentage = rows.length
                    ? Math.round((count / rows.length) * 100)
                    : 0

                  return (
                    <div
                      key={risk}
                      className={`rounded-xl border ${meta.border} ${meta.bg} p-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${meta.dot}`} />
                          <span className={`text-xs font-semibold ${meta.text}`}>
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {count}
                        </span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-900/70">
                        <div
                          className={`h-full rounded-full ${meta.dot}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
                <div>
                  <p className="text-[11px] text-slate-500">Đơn lâu nhất</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {oldestOrder?.days ?? 0} ngày
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Cảnh báo + nguy hiểm</p>
                  <p className="mt-1 text-sm font-semibold text-red-300">
                    {warningCount + criticalCount} đơn
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTER */}
        <Card className="border-slate-800 bg-[#0e1724] shadow-none">
          <CardContent className="p-3">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Tìm mã đơn, tên khách, SĐT hoặc SKU..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-11 border-slate-700 bg-slate-950/70 pl-9 text-slate-200 placeholder:text-slate-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-11 w-full border-slate-700 bg-slate-950/70 text-slate-200 lg:w-[210px]">
                  <SelectValue placeholder="Mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="normal">Theo dõi</SelectItem>
                  <SelectItem value="watch">Cần gọi</SelectItem>
                  <SelectItem value="warning">Cảnh báo</SelectItem>
                  <SelectItem value="critical">Nguy hiểm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* TABLE */}
        <Card className="overflow-hidden border-slate-800 bg-[#0e1724] shadow-none">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Danh sách đơn nợ hàng
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Nhấn vào đơn để xem chi tiết và xử lý
              </p>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
              {rows.length} đơn
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Sản phẩm / SKU</th>
                    <th className="px-4 py-3">Ngày lên đơn</th>
                    <th className="px-4 py-3">Đã chờ</th>
                    <th className="px-4 py-3">Dự kiến hàng về</th>
                    <th className="px-4 py-3">Giá trị</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-5 py-3 text-right">Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {rows.map((o) => {
                    const meta = riskMeta[o.risk as Risk]

                    return (
                      <tr
                        key={o.id}
                        className="group cursor-pointer transition-colors hover:bg-violet-500/[0.035]"
                        onClick={() => {
                          setSelected(o)
                          setOpen(true)
                        }}
                      >
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs font-semibold text-violet-300">
                            {o.order_code}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-200">
                            {o.customers?.full_name || 'Khách lẻ'}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {o.customers?.phone || '-'}
                          </div>
                        </td>
                        <td className="max-w-[300px] px-4 py-4">
                          {o.items.slice(0, 2).map((item: any, i: number) => (
                            <div
                              key={item.id || i}
                              className="truncate text-slate-300"
                            >
                              <b className="font-medium">
                                {item.product_name || item.name || 'Sản phẩm'}
                              </b>
                              <span className="ml-2 font-mono text-[11px] text-slate-500">
                                {item.sku || '-'} × {item.quantity || 0}
                              </span>
                            </div>
                          ))}
                          {o.items.length > 2 && (
                            <div className="mt-1 text-xs text-violet-300">
                              +{o.items.length - 2} sản phẩm
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-400">
                          {formatDateTime(o.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-200">
                            {o.days} ngày
                          </div>
                          {o.days >= 8 && (
                            <div className="mt-0.5 text-[11px] text-red-400">
                              Khách đã chờ lâu
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="size-3.5 text-violet-400" />
                            {o.expected_stock_date
                              ? new Date(
                                  `${o.expected_stock_date}T00:00:00`,
                                ).toLocaleDateString('vi-VN')
                              : 'Chưa có ETA'}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-200">
                          {formatVND(o.total_amount)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
                          >
                            <span className={`size-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td
                          className="px-5 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void markReady(o)}
                            className="border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                          >
                            <CheckCircle2 className="mr-1.5 size-3.5" />
                            Đã đủ hàng
                          </Button>
                        </td>
                      </tr>
                    )
                  })}

                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                          <Package className="size-7" />
                        </div>
                        <div className="mt-4 font-semibold text-slate-200">
                          Không có đơn nợ hàng
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Các đơn hiện tại đều đã đủ hàng hoặc chưa được đánh dấu.
                        </div>
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <RefreshCw className="mx-auto size-6 animate-spin text-violet-400" />
                        <p className="mt-3 text-sm text-slate-500">
                          Đang tải danh sách đơn nợ hàng...
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <OrderDetailSheet
          order={selected}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </PageShell>
  )
}
