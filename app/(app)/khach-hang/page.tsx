'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Copy, Check, MoreVertical, Eye, Pencil, Trash2, X, UserRound, Phone, Mail, MapPin, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function CustomersPage() {
    const [openCustomer, setOpenCustomer] =
  useState(false)

const [customerName, setCustomerName] =
  useState('')

const [customerPhone, setCustomerPhone] =
  useState('')

const [customerEmail, setCustomerEmail] =
  useState('')

const [customerAddress, setCustomerAddress] =
  useState('')

const [customers, setCustomers] =
  useState<any[]>([])

const [search, setSearch] =
  useState('')

const [dateFilter, setDateFilter] =
  useState('ALL')

const [customerTypeFilter, setCustomerTypeFilter] =
  useState('ALL')

const [orderHistoryCustomer, setOrderHistoryCustomer] =
  useState<any>(null)

const [orderHistory, setOrderHistory] =
  useState<any[]>([])

const [orderHistoryLoading, setOrderHistoryLoading] =
  useState(false)

const [selectedCustomer, setSelectedCustomer] =
  useState<any>(null)

const [viewModal, setViewModal] =
  useState(false)

  const [editCustomer, setEditCustomer] =
  useState<any>(null)

  const [savingCustomer, setSavingCustomer] =
  useState(false)

useEffect(() => {
  loadCustomers()
}, [])

const loadCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('CUSTOMERS LOAD ERROR:', error)
    alert(error.message)
    return
  }

  const customerRows = data || []
  const orderRows: any[] = []
  const pageSize = 1000
  let from = 0

  // Only completed orders contribute to customer order count and lifetime spend.
  // Fetch in pages to avoid Supabase's default row limit.
  while (true) {
    const { data: page, error: ordersError } = await supabase
      .from('orders')
      .select('customer_id, total_amount')
      .eq('status', 'completed')
      .not('customer_id', 'is', null)
      .range(from, from + pageSize - 1)

    if (ordersError) {
      console.error('CUSTOMER ORDER TOTALS ERROR:', ordersError)
      alert(ordersError.message)
      return
    }

    orderRows.push(...(page || []))
    if (!page || page.length < pageSize) break
    from += pageSize
  }

  const orderCounts = new Map<string, number>()
  const totalSpentByCustomer = new Map<string, number>()

  // Track the latest order date separately from completed-order totals.
  // Date filters should include existing customers who placed an order today.
  const activityRows: any[] = []
  let activityFrom = 0
  while (true) {
    const { data: activityPage, error: activityError } = await supabase
      .from('orders')
      .select('customer_id, created_at')
      .not('customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(activityFrom, activityFrom + pageSize - 1)

    if (activityError) {
      console.error('CUSTOMER ORDER ACTIVITY ERROR:', activityError)
      alert(activityError.message)
      return
    }

    activityRows.push(...(activityPage || []))
    if (!activityPage || activityPage.length < pageSize) break
    activityFrom += pageSize
  }

  const latestOrderAtByCustomer = new Map<string, string>()
  activityRows.forEach((order: any) => {
    if (!order.customer_id || !order.created_at) return
    const current = latestOrderAtByCustomer.get(order.customer_id)
    if (!current || new Date(order.created_at).getTime() > new Date(current).getTime()) {
      latestOrderAtByCustomer.set(order.customer_id, order.created_at)
    }
  })

  orderRows.forEach((order: any) => {
    if (!order.customer_id) return

    orderCounts.set(
      order.customer_id,
      (orderCounts.get(order.customer_id) || 0) + 1
    )

    totalSpentByCustomer.set(
      order.customer_id,
      (totalSpentByCustomer.get(order.customer_id) || 0) + Number(order.total_amount || 0)
    )
  })

  setCustomers(
    customerRows.map((customer: any) => ({
      ...customer,
      total_orders: orderCounts.get(customer.id) ?? 0,
      total_spent: totalSpentByCustomer.get(customer.id) ?? 0,
      latest_order_at: latestOrderAtByCustomer.get(customer.id) ?? null,
    }))
  )
}

const loadCustomerOrderHistory = async (customer: any) => {
  setOrderHistoryCustomer(customer)
  setOrderHistory([])
  setOrderHistoryLoading(true)

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('ORDER HISTORY ERROR:', ordersError)
    alert(ordersError.message)
    setOrderHistoryLoading(false)
    return
  }

  if (!orders || orders.length === 0) {
    setOrderHistory([])
    setOrderHistoryLoading(false)
    return
  }

  const orderIds = orders.map((order: any) => order.id)
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds)

  if (itemsError) {
    console.error('ORDER ITEMS ERROR:', itemsError)
    alert(itemsError.message)
    setOrderHistoryLoading(false)
    return
  }

  setOrderHistory(
    orders.map((order: any) => ({
      ...order,
      items: (items || []).filter(
        (item: any) => item.order_id === order.id
      ),
    }))
  )
  setOrderHistoryLoading(false)
}

const ITEMS_PER_PAGE = 10

const [currentPage, setCurrentPage] =
  useState(1)

const filteredCustomers =
  customers.filter((customer) => {

    const keyword =
      search.toLowerCase()

    const matchSearch =
      customer.full_name
        ?.toLowerCase()
        .includes(keyword) ||

      customer.phone
        ?.toLowerCase()
        .includes(keyword) ||

      customer.email
        ?.toLowerCase()
        .includes(keyword) ||
      customer.customer_display_code
        ?.toLowerCase()
        .includes(keyword) ||
      customer.customer_code
        ?.toLowerCase()
        .includes(keyword)

    if (!matchSearch) return false

    const totalOrders = Number(customer.total_orders || 0)

    if (customerTypeFilter === 'NEW' && totalOrders > 1) return false
    if (customerTypeFilter === 'REPEAT' && totalOrders <= 1) return false

    // Date filters are based on order activity, not customer profile creation.
    // This allows an existing customer (e.g. VĂN ÚT) to appear when they buy again today.
    if (dateFilter === 'ALL') return true

    if (!customer.latest_order_at) return false

    const latestOrderDate = new Date(customer.latest_order_at)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const orderDay = new Date(
      latestOrderDate.getFullYear(),
      latestOrderDate.getMonth(),
      latestOrderDate.getDate()
    )
    const diffDays = Math.floor(
      (startOfToday.getTime() - orderDay.getTime()) / 86400000
    )

    switch (dateFilter) {
      case 'TODAY':
        return orderDay.getTime() === startOfToday.getTime()
      case '7D':
        return diffDays >= 0 && diffDays <= 7
      case '30D':
        return diffDays >= 0 && diffDays <= 30
      case '90D':
        return diffDays >= 0 && diffDays <= 90
      default:
        return true
    }
  })

const totalPages = Math.ceil(
  filteredCustomers.length /
    ITEMS_PER_PAGE
)

const paginatedCustomers =
  filteredCustomers.slice(
    (currentPage - 1) *
      ITEMS_PER_PAGE,
    currentPage *
      ITEMS_PER_PAGE
  )

const currentMonthCustomers =
  customers.filter((c) => {

    if (!c.created_at)
      return false

    const d =
      new Date(c.created_at)

    const now = new Date()

    return (
      d.getMonth() ===
        now.getMonth() &&
      d.getFullYear() ===
        now.getFullYear()
    )
  }).length

const handleExportExcel = () => {

  const worksheet =
    XLSX.utils.json_to_sheet(
      filteredCustomers.map(
        (c) => ({

          Tên: c.full_name,

          Mã_KH: getCustomerCode(c),

          SĐT: c.phone,

          Email: c.email,

          Tổng_Đơn:
            Number(c.total_orders || 0),

          Số_Lần_Mua_Lại:
            Math.max(Number(c.total_orders || 0) - 1, 0),

          Tổng_Chi_Tiêu:
            c.total_spent,

          Ngày_Tạo:
            c.created_at,
        })
      )
    )

  const workbook =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Customers'
  )

  XLSX.writeFile(
    workbook,
    'customers.xlsx'
  )
}

const [deleteCustomer, setDeleteCustomer] =
  useState<any>(null)

const [openMenu, setOpenMenu] =
  useState<string | null>(null)

const [copiedCustomerId, setCopiedCustomerId] =
  useState<string | null>(null)

const getCustomerCode = (customer: any) =>
  customer.customer_display_code ||
  customer.customer_code ||
  ''

const handleCopyCustomerCode = async (customer: any) => {
  const code = getCustomerCode(customer)

  if (!code) {
    alert('Khách hàng chưa có mã KH')
    return
  }

  try {
    await navigator.clipboard.writeText(code)
    setCopiedCustomerId(customer.id)
    window.setTimeout(() => {
      setCopiedCustomerId((current) =>
        current === customer.id ? null : current
      )
    }, 1600)
  } catch {
    alert('Không thể sao chép mã KH')
  }
}

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Khách hàng
          </h1>

          <p className="text-slate-400">
            Quản lý khách hàng và lịch sử mua hàng
          </p>
        </div>

        <Button
  onClick={() =>
    setOpenCustomer(true)
  }
>
  + Thêm khách hàng
</Button>

      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <Card>
          <CardContent className="p-6">
            <p className="text-slate-400">
              Tổng khách hàng
            </p>

            <p className="mt-3 text-4xl font-bold">
              {customers.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-slate-400">
  Khách mới tháng này
</p>

<p className="mt-3 text-4xl font-bold">
  {currentMonthCustomers}
</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-slate-400">
              Khách VIP
            </p>

            <p className="mt-3 text-4xl font-bold">
              {
  customers.filter(
    (c) => c.total_spent >= 10000000
  ).length
}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-slate-400">
              Tổng doanh thu KH
            </p>

            <p className="mt-3 text-4xl font-bold">
              {
  customers
    .reduce(
      (sum, c) =>
        sum +
        Number(
          c.total_spent || 0
        ),
      0
    )
    .toLocaleString('vi-VN')
} đ
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Search */}
      <Card>
        <CardContent className="flex gap-3 p-6">

          <Input
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
  placeholder="Tìm tên, SĐT hoặc Email..."
/>

<select
  value={dateFilter}
  onChange={(e) => {
    setDateFilter(e.target.value)
    setCurrentPage(1)
  }}
  className="
    rounded-lg
    border
    border-slate-700
    bg-slate-900
    px-4
  "
>
  <option value="ALL">
    Tất cả
  </option>

  <option value="TODAY">
    Hôm nay
  </option>

  <option value="7D">
    7 ngày
  </option>

  <option value="30D">
    30 ngày
  </option>

  <option value="90D">
    90 ngày
  </option>
</select>

<select
  value={customerTypeFilter}
  onChange={(e) => {
    setCustomerTypeFilter(e.target.value)
    setCurrentPage(1)
  }}
  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white"
>
  <option value="ALL">Tất cả khách hàng</option>
  <option value="NEW">Khách mới</option>
  <option value="REPEAT">Khách mua lại</option>
</select>

          <Button
  variant="outline"
  onClick={handleExportExcel}
>
  Xuất Excel
</Button>

        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1120px]">

            <thead>

              <tr className="border-b border-slate-800">

                <th className="p-4 text-left">
                  STT
                 </th>

                <th className="p-4 text-left">
                  Khách hàng
                </th>

                <th className="p-4 text-left">
                  Số điện thoại
                </th>

                <th className="p-4 text-left">
                  Email
                </th>

                <th className="p-4 text-center whitespace-nowrap">
                  Tổng đơn
                </th>

                <th className="p-4 text-center whitespace-nowrap">
                  Mua lại
                </th>

                <th className="p-4 text-left whitespace-nowrap">
                  Tổng chi tiêu
                </th>

                <th className="p-4 text-left">
                  Ngày Tạo
                </th>  



                <th className="p-4 text-center">
                  Thao tác
                 </th>


              </tr>

            </thead>

           <tbody>

{filteredCustomers.length === 0 ? (

<tr>
  <td
    colSpan={9}
    className="h-40 text-center text-slate-400"
  >
    Không tìm thấy khách hàng phù hợp
  </td>
</tr>

) : (

paginatedCustomers.map(
(customer, index) => (

<tr
  key={customer.id}
  className="border-b border-slate-800"
>


<td className="p-4">
  {(currentPage - 1) *
    ITEMS_PER_PAGE +
    index +
    1}
</td>

  <td className="p-4">

  <div className="min-w-0">

      <p className="font-semibold text-white">
        {customer.full_name}
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleCopyCustomerCode(customer)}
          disabled={!getCustomerCode(customer)}
          title="Sao chép mã khách hàng"
          className="inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {getCustomerCode(customer) || 'Chưa có mã KH'}
          {copiedCustomerId === customer.id ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {customer.phone || 'Chưa có SĐT'}
      </p>

  </div>

</td>

  <td className="p-4">
    {customer.phone}
  </td>

  <td className="p-4">
    {customer.email || '-'}
  </td>

  <td className="p-4 text-center">
    <button
      type="button"
      onClick={() => loadCustomerOrderHistory(customer)}
      className="inline-flex min-w-9 justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20 hover:text-cyan-200"
      title="Xem lịch sử đơn hàng"
    >
      {Number(customer.total_orders || 0)}
    </button>
  </td>

  <td className="p-4 text-center">
    {Number(customer.total_orders || 0) > 1 ? (
      <span className="inline-flex whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
        Mua lại {Number(customer.total_orders || 0) - 1} lần
      </span>
    ) : (
      <span className="inline-flex whitespace-nowrap rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
        Khách mới
      </span>
    )}
  </td>

  <td className="p-4">
    {Number(
      customer.total_spent || 0
    ).toLocaleString('vi-VN')} đ
  </td>

  <td>
  {customer.created_at
    ? new Date(
        customer.created_at
      ).toLocaleDateString('vi-VN')
    : '-'}
  </td>

  <td className="relative p-4 text-center">

  <button
    onClick={() =>
      setOpenMenu(
        openMenu === customer.id
          ? null
          : customer.id
      )
    }
    className="
      rounded-full
      bg-slate-800
      px-3
      py-2
      font-bold
      hover:bg-cyan-500
      hover:text-black
    "
  >
    <MoreVertical className="h-5 w-5" />
  </button>

  {openMenu === customer.id && (

    <div
      className="
        absolute
        right-4
        z-50
        mt-2
        w-40
        overflow-hidden
        rounded-xl
        border
        border-slate-700
        bg-slate-900
        shadow-xl
      "
    >

      <button
        onClick={() => {
          setSelectedCustomer(customer)
          setViewModal(true)
          setOpenMenu(null)
        }}
        className="
          block
          w-full
          px-4
          py-3
          text-left
          hover:bg-slate-800
        "
      >
        <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Xem</span>
      </button>

      <button
        onClick={() => {
          setEditCustomer(customer)
          setOpenMenu(null)
        }}
        className="
          block
          w-full
          px-4
          py-3
          text-left
          hover:bg-slate-800
        "
      >
        <span className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Sửa</span>
      </button>

      <button
        onClick={() => {
          setDeleteCustomer(customer)
          setOpenMenu(null)
        }}
        className="
          block
          w-full
          px-4
          py-3
          text-left
          text-red-400
          hover:bg-red-500/10
        "
      >
        <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Xóa</span>
      </button>

    </div>

  )}

</td>



</tr>

))

)}

</tbody>

         </table>

<div className="flex items-center justify-between border-t border-slate-800 p-4">

  <p className="text-sm text-slate-400">

    Hiển thị

    {' '}
    {(currentPage - 1) *
      ITEMS_PER_PAGE +
      1}

    -

    {Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredCustomers.length
    )}

    / {filteredCustomers.length}

    khách hàng

  </p>

  <div className="flex items-center gap-2">

  <button
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage(currentPage - 1)
    }
    className="rounded-full bg-slate-800 px-4 py-2 disabled:opacity-50"
  >
    ←
  </button>

  {Array.from(
    { length: totalPages },
    (_, i) => (
      <button
        key={i}
        onClick={() =>
          setCurrentPage(i + 1)
        }
        className={`rounded-full px-4 py-2 ${
          currentPage === i + 1
            ? 'bg-cyan-500 text-black'
            : 'bg-slate-800'
        }`}
      >
        {i + 1}
      </button>
    )
  )}

  <button
    disabled={
      currentPage === totalPages
    }
    onClick={() =>
      setCurrentPage(currentPage + 1)
    }
    className="rounded-full bg-slate-800 px-4 py-2 disabled:opacity-50"
  >
    →
  </button>

  

</div>

</div>

</div>

</CardContent>
      </Card>

{viewModal && selectedCustomer && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

  <div className="w-full max-w-xl rounded-2xl bg-slate-950 p-6">

    <div className="mb-6 flex items-center justify-between">

      <h2 className="text-2xl font-bold">
        Chi tiết khách hàng
      </h2>

      <button
        onClick={() =>
          setViewModal(false)
        }
      >
        ✕
      </button>

    </div>

    <div className="grid gap-4">

      <div>
        <p className="text-slate-400">
          Họ tên
        </p>

        <p className="font-semibold">
          {selectedCustomer.full_name}
        </p>
      </div>

      <div>
        <p className="text-slate-400">
          Mã khách hàng
        </p>
        <button
          type="button"
          onClick={() => handleCopyCustomerCode(selectedCustomer)}
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-cyan-500/10 px-2 py-1 font-semibold text-cyan-300"
        >
          {getCustomerCode(selectedCustomer) || '-'}
          {copiedCustomerId === selectedCustomer.id ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div>
        <p className="text-slate-400">
          Số điện thoại
        </p>

        <p>
          {selectedCustomer.phone}
        </p>
      </div>

      <div>
        <p className="text-slate-400">
          Email
        </p>

        <p>
          {selectedCustomer.email || '-'}
        </p>
      </div>

      <div>
        <p className="text-slate-400">
          Địa chỉ
        </p>

        <p>
          {selectedCustomer.address || '-'}
        </p>
      </div>

      <div>
        <p className="text-slate-400">
          Tổng đơn
        </p>

        <p>
          {selectedCustomer.total_orders}
        </p>
      </div>

      <div>
        <p className="text-slate-400">
          Số lần mua lại
        </p>
        <p className="font-semibold text-emerald-400">
          {Math.max(Number(selectedCustomer.total_orders || 0) - 1, 0)} lần
        </p>
      </div>

      <div>
        <p className="text-slate-400">
          Tổng chi tiêu
        </p>

        <p className="font-bold text-green-400">
          {Number(
            selectedCustomer.total_spent || 0
          ).toLocaleString('vi-VN')} đ
        </p>
      </div>

      <div>
        <p className="text-slate-400">
          Ngày tạo
        </p>

        <p>
          {selectedCustomer.created_at
            ? new Date(
                selectedCustomer.created_at
              ).toLocaleDateString('vi-VN')
            : '-'}
        </p>
      </div>

    </div>

  </div>

</div>

)}

{orderHistoryCustomer && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Lịch sử mua hàng</h2>
          <p className="mt-1 text-sm text-slate-400">
            {orderHistoryCustomer.full_name} · {orderHistoryCustomer.phone}
          </p>
          <p className="mt-1 text-xs font-semibold text-cyan-400">
            Mã KH: {getCustomerCode(orderHistoryCustomer) || '-'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOrderHistoryCustomer(null)
            setOrderHistory([])
          }}
          className="rounded-lg bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      {orderHistoryLoading ? (
        <div className="py-16 text-center text-slate-400">
          Đang tải lịch sử đơn hàng...
        </div>
      ) : orderHistory.length === 0 ? (
        <div className="rounded-xl border border-slate-800 py-16 text-center text-slate-400">
          Khách hàng chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="space-y-4">
          {orderHistory.map((order: any) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
                <div>
                  <p className="font-bold text-cyan-300">
                    {order.order_code || 'Đơn hàng'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString('vi-VN')
                      : '-'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {order.status || 'Chưa xác định'}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    order.payment_status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : order.payment_status === 'partial'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {order.payment_status === 'paid'
                      ? 'Đã thanh toán'
                      : order.payment_status === 'partial'
                      ? 'Thanh toán một phần'
                      : order.payment_status === 'unpaid'
                      ? 'Chưa thanh toán'
                      : order.payment_status || '-'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sản phẩm đã mua
                </p>
                {order.items?.length ? (
                  <div className="space-y-3">
                    {order.items.map((item: any, index: number) => (
                      <div
                        key={item.id || index}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">
                            {item.product_name || 'Sản phẩm'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            SKU: {item.sku || '-'}
                            {item.color ? ` · Màu: ${item.color}` : ''}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            SL: {Number(item.quantity || 0)} × {Number(item.sale_price || 0).toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                        <p className="whitespace-nowrap font-semibold text-white">
                          {Number(item.subtotal || 0).toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Không có chi tiết sản phẩm trong đơn này.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-800 bg-slate-950/60 p-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Tạm tính</span>
                  <span>{Number(order.subtotal || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-slate-400">
                  <span>Phí vận chuyển</span>
                  <span>{Number(order.shipping_fee || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-slate-400">
                  <span>Đã thanh toán</span>
                  <span>{Number(order.paid_amount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-800 pt-3">
                  <span className="font-semibold text-white">Tổng đơn hàng</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {Number(order.total_amount || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setOrderHistoryCustomer(null)
            setOrderHistory([])
          }}
          className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
)}

{deleteCustomer && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

  <div className="w-[400px] rounded-xl bg-slate-950 p-6">

    <h2 className="mb-4 text-xl font-bold">
      Xóa khách hàng
    </h2>

    <p>
      {deleteCustomer.full_name}
    </p>

    <div className="mt-6 flex gap-2">

      <button
        onClick={() =>
          setDeleteCustomer(null)
        }
        className="flex-1 rounded-lg bg-slate-700 py-3"
      >
        Hủy
      </button>

      <button
        onClick={async () => {

          const { error } =
            await supabase
              .from('customers')
              .delete()
              .eq(
                'id',
                deleteCustomer.id
              )

          if (error) {
            alert(error.message)
            return
          }

          loadCustomers()

          setDeleteCustomer(null)

        }}
        className="flex-1 rounded-lg bg-red-500 py-3"
      >
        Xóa
      </button>

    </div>

  </div>

</div>

)}

{editCustomer && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget && !savingCustomer) setEditCustomer(null)
    }}
  >
    <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl shadow-black/50">
      <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5 sm:px-7">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <UserRound className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Sửa hồ sơ khách hàng</h2>
          <p className="mt-1 text-sm text-slate-400">Cập nhật thông tin liên hệ và địa chỉ khách hàng.</p>
        </div>
        <button
          type="button"
          onClick={() => !savingCustomer && setEditCustomer(null)}
          disabled={savingCustomer}
          aria-label="Đóng"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 px-6 py-6 sm:px-7">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Họ và tên <span className="text-rose-400">*</span></label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              value={editCustomer.full_name || ''}
              onChange={(e) => setEditCustomer({ ...editCustomer, full_name: e.target.value })}
              placeholder="Nhập họ và tên"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Số điện thoại</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={editCustomer.phone || ''}
                onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={editCustomer.email || ''}
                onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Địa chỉ</label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <textarea
              rows={3}
              value={editCustomer.address || ''}
              onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
              placeholder="Nhập địa chỉ nhận hàng"
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-900/40 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
        <button
          type="button"
          disabled={savingCustomer}
          onClick={() => setEditCustomer(null)}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50 sm:min-w-28"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={savingCustomer}
          onClick={async () => {
            if (!editCustomer?.id) {
              alert('Không tìm thấy ID khách hàng. Vui lòng đóng và mở lại form sửa.')
              return
            }
            setSavingCustomer(true)
            try {
              const updatePayload = {
                full_name: String(editCustomer.full_name || '').trim(),
                phone: String(editCustomer.phone || '').trim(),
                email: String(editCustomer.email || '').trim() || null,
                address: String(editCustomer.address || '').trim() || null,
              }
              if (!updatePayload.full_name) {
                alert('Vui lòng nhập tên khách hàng.')
                return
              }
              const { data, error } = await supabase
                .from('customers')
                .update(updatePayload)
                .eq('id', editCustomer.id)
                .select('id')
                .maybeSingle()
              if (error) {
                console.error('CUSTOMER UPDATE ERROR:', error)
                alert(`Không thể lưu khách hàng: ${error.message}`)
                return
              }
              if (!data) {
                alert('Không có khách hàng nào được cập nhật. Kiểm tra lại ID hoặc quyền UPDATE (RLS) trên bảng customers.')
                return
              }
              await loadCustomers()
              setEditCustomer(null)
              alert('Đã cập nhật thông tin khách hàng.')
            } catch (err: any) {
              console.error('CUSTOMER UPDATE UNEXPECTED ERROR:', err)
              alert(`Có lỗi khi lưu: ${err?.message || 'Lỗi không xác định'}`)
            } finally {
              setSavingCustomer(false)
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-40"
        >
          {savingCustomer ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" /> Đang lưu...</> : <><Save className="h-4 w-4" /> Lưu thay đổi</>}
        </button>
      </div>
    </div>
  </div>
)}

{openCustomer && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

  <div className="w-[500px] rounded-xl bg-slate-950 p-6">

    <h2 className="mb-6 text-xl font-bold">
      Thêm khách hàng
    </h2>

    <input
      placeholder="Tên khách hàng"
      value={customerName}
      onChange={(e) =>
        setCustomerName(
          e.target.value
        )
      }
      className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
    />

    <input
      placeholder="Số điện thoại"
      value={customerPhone}
      onChange={(e) =>
        setCustomerPhone(
          e.target.value
        )
      }
      className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
    />

    <input
      placeholder="Email"
      value={customerEmail}
      onChange={(e) =>
        setCustomerEmail(
          e.target.value
        )
      }
      className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
    />

    <input
      placeholder="Địa chỉ"
      value={customerAddress}
      onChange={(e) =>
        setCustomerAddress(
          e.target.value
        )
      }
      className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
    />

    <div className="flex gap-2">

      <button
        onClick={async () => {

  const { error } =
    await supabase
      .from('customers')
      .insert({

        full_name:
          customerName,

        phone:
          customerPhone,

        email:
          customerEmail,

        address:
          customerAddress,

        total_orders: 0,

        total_spent: 0,
      })

  if (error) {
    alert(error.message)
    return
  }

  await loadCustomers()

  setCustomerName('')
  setCustomerPhone('')
  setCustomerEmail('')
  setCustomerAddress('')

  setOpenCustomer(false)

}}
        className="flex-1 rounded-lg bg-cyan-500 py-3 font-semibold text-black"
      >
        Lưu khách hàng
      </button>

      <button
        onClick={() =>
          setOpenCustomer(false)
        }
        className="flex-1 rounded-lg bg-slate-700 py-3"
      >
        Hủy
      </button>

    </div>

  </div>

</div>

)}

    </div>


  )
}