'use client'

import Image from "next/image"
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UserPlus,
  User,
  Phone,
  MapPin,
  Percent,
  Truck,
  X,
  Save,
  Check,
  ChevronDown,
} from 'lucide-react'
import { PageShell, PageHeading } from '@/components/page-shell'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'


interface CartLine {
  product: any
  quantity: number
  price: number
}

type CreateOrderClientProps = {
  mode?: string
  orderId?: string
}

export function CreateOrderClient({
  mode,
  orderId,
}: CreateOrderClientProps) {

  const router = useRouter()

  const [paymentMethod, setPaymentMethod] =
  useState('COD')

const [shippingProvider, setShippingProvider] =
  useState('GHN')

const [shippingMethod, setShippingMethod] =
  useState('standard')

const [paidAmount, setPaidAmount] =
  useState(0)

  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] =
    useState('all')

  const [stockFilter, setStockFilter] =
  useState('all')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<CartLine[]>([])
  const [productsData, setProductsData] = useState<any[]>([])
  const [customersData, setCustomersData] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerCode, setCustomerCode] =
  useState('')

  
  

 const [customerName, setCustomerName] =
  useState('')


const [customerTitle, setCustomerTitle] =
  useState<'Anh' | 'Chị'>('Anh')

const [customerSource, setCustomerSource] =
  useState('Website')

const [customerNote, setCustomerNote] =
  useState('')

const [createdOrderCode, setCreatedOrderCode] =
  useState('')

const [createdOrderDate, setCreatedOrderDate] =
  useState('')

  const isEdit = mode === 'edit'

const isDuplicate =
  mode === 'duplicate'


  useEffect(() => {
  if (!orderId) return

  loadOrder(orderId)
}, [orderId])

  useEffect(() => {
  console.log({
    mode,
    orderId,
    isEdit,
    isDuplicate,
  })
}, [])

const [customerPhone, setCustomerPhone] =
  useState('')

const [customerAddress, setCustomerAddress] =
  useState('')

  
  // =========================
  // ADDRESS
  // =========================
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])

  const [selectedProvince, setSelectedProvince] = useState('')
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [provinceSearch, setProvinceSearch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [addressLoading, setAddressLoading] = useState(false)

const [discountType, setDiscountType] = useState<'percent' | 'amount'>('amount')

const [discountValue, setDiscountValue] = useState(0)


useEffect(() => {

  if (
    !customerName ||
    customerPhone.length < 4
  ) {
    setCustomerCode('')
    return
  }

  const lastName =
  customerName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(' ')
    .pop()
    ?.substring(0, 2)
    .toUpperCase() || 'KH'

  const last4Phone =
    customerPhone
      .replace(/\D/g, '')
      .slice(-4)

  const now = new Date()

  const dd =
    String(now.getDate())
      .padStart(2, '0')

  const mm =
    String(now.getMonth() + 1)
      .padStart(2, '0')

setCustomerCode(
  `KH ${lastName}-${last4Phone}-${dd}${mm}`
)

}, [
  customerName,
  customerPhone,
])

const [shippingFee, setShippingFee] =
  useState(35000)

  

  // Load Vietnam address hierarchy
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setAddressLoading(true)
        const res = await fetch(
          'https://provinces.open-api.vn/api/?depth=1'
        )
        if (!res.ok) throw new Error('Không thể tải tỉnh/thành phố')
        setProvinces((await res.json()) || [])
      } catch (error) {
        console.error('LOAD PROVINCES ERROR', error)
        toast.error('Không tải được danh sách tỉnh/thành phố')
      } finally {
        setAddressLoading(false)
      }
    }

    loadProvinces()
  }, [])

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([])
      setWards([])
      setSelectedDistrict('')
      setSelectedWard('')
      return
    }

    const loadDistricts = async () => {
      try {
        setAddressLoading(true)
        const res = await fetch(
          `https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`
        )
        if (!res.ok) throw new Error('Không thể tải quận/huyện')
        const data = await res.json()
        setDistricts(data?.districts || [])
        setWards([])
        setSelectedDistrict('')
        setSelectedWard('')
      } catch (error) {
        console.error('LOAD DISTRICTS ERROR', error)
        toast.error('Không tải được danh sách quận/huyện')
      } finally {
        setAddressLoading(false)
      }
    }

    loadDistricts()
  }, [selectedProvince])

  useEffect(() => {
    if (!selectedDistrict) {
      setWards([])
      setSelectedWard('')
      return
    }

    const loadWards = async () => {
      try {
        setAddressLoading(true)
        const res = await fetch(
          `https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`
        )
        if (!res.ok) throw new Error('Không thể tải phường/xã')
        const data = await res.json()
        setWards(data?.wards || [])
        setSelectedWard('')
      } catch (error) {
        console.error('LOAD WARDS ERROR', error)
        toast.error('Không tải được danh sách phường/xã')
      } finally {
        setAddressLoading(false)
      }
    }

    loadWards()
  }, [selectedDistrict])

  useEffect(() => {
    const provinceName =
      provinces.find((item) => String(item.code) === String(selectedProvince))?.name || ''

    const districtName =
      districts.find((item) => String(item.code) === String(selectedDistrict))?.name || ''

    const wardName =
      wards.find((item) => String(item.code) === String(selectedWard))?.name || ''

    setCustomerAddress(
      [streetAddress.trim(), wardName, districtName, provinceName]
        .filter(Boolean)
        .join(', ')
    )
  }, [
    streetAddress,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    provinces,
    districts,
    wards,
  ])

  const [orderNote, setOrderNote] = useState('')
  const [showAllProducts, setShowAllProducts] =
    useState(false)
  const [showPrint, setShowPrint] =
    useState(false)

  const [showConfirm, setShowConfirm] =
  useState(false)

  const filteredProducts = productsData.filter((p) => {

  const matchSearch =
    !search ||
    p.name?.toLowerCase().includes(
      search.toLowerCase()
    ) ||
    p.sku?.toLowerCase().includes(
      search.toLowerCase()
    )

  const matchProduct =
    selectedProduct === 'all' ||
    p.name === selectedProduct

  const matchStock =
    stockFilter === 'all'
      ? true
      : stockFilter === 'active'
      ? Number(p.stock_quantity) > 5
      : stockFilter === 'low'
      ? Number(p.stock_quantity) > 0 &&
        Number(p.stock_quantity) <= 5
      : Number(p.stock_quantity) <= 0

  return (
    matchSearch &&
    matchProduct &&
    matchStock
  )
})


const filteredProvinces = provinces.filter((province) =>
  province.name
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes(
      provinceSearch
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    )
)

useEffect(() => {

  loadData()

  if (orderId) {
    loadOrder(orderId)
  }

}, [orderId])
  const displayedProducts = filteredProducts

  const loadData = async () => {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('sku')

    console.log(products)

    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .order('full_name')

    setProductsData(products || [])
    setCustomersData(customers || [])
  }

const loadOrder = async (id: string) => {

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(*),
      order_items(*)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return

  console.log('LOAD ORDER', data)

  //=========================
  // CUSTOMER
  //=========================
  setCustomerName(data.customers?.full_name || '')
  setCustomerTitle(data.customers?.customer_title === 'Chị' ? 'Chị' : 'Anh')
  setCustomerSource(data.customers?.customer_source || 'Website')
  setCustomerNote(data.customers?.customer_note || '')
  setCustomerPhone(data.customers?.phone || '')
  setCustomerAddress(data.customers?.address || '')
  setStreetAddress(data.customers?.address || '')
  setCustomerCode(data.customers?.customer_display_code || '')
  setCreatedOrderCode(data.order_code || '')
  setCreatedOrderDate(data.created_at ? new Date(data.created_at).toLocaleDateString('vi-VN') : '')

  //=========================
  // PAYMENT
  //=========================

  setShippingFee(data.shipping_fee || 0)

  setPaymentMethod(data.payment_method || 'COD')

  setPaidAmount(data.paid_amount || 0)

  setShippingProvider(
    data.shipping_provider || 'GHN'
  )

  setShippingMethod(
    data.shipping_method || 'standard'
  )

  setDiscountValue(data.discount || 0)

  setDiscountType('amount')

  //=========================
  // CART
  //=========================

  const lines =
    (data.order_items || []).map((item: any) => ({

      product: {
        id: item.product_id,
        name: item.product_name,
        sku: item.sku,
        color: item.color,
        image_url: item.image_url || '',
        stock_quantity: 9999,
      },

      quantity: item.quantity,

      price: item.sale_price,

    }))

  setCart(lines)
}

  const matchedCustomers = useMemo(
    () =>
      customerSearch
        ? customersData
          .filter(
            (c) =>
              c.full_name
                .toLowerCase()
                .includes(customerSearch.toLowerCase()) ||
              c.phone.includes(customerSearch),
          )
          .slice(0, 4)
        : [],
    [customerSearch, customersData],
  )


  const addToCart = (p: any) => {

  if ((p.stock_quantity || 0) <= 0) {
    toast.error(
      'Sản phẩm đã hết hàng. Vui lòng nhập thêm hàng.'
    )
    return
  }

  setCart((prev) => {

    const existing = prev.find(
      (l) => l.product.id === p.id
    )

    if (existing) {

      if (
        existing.quantity >=
        p.stock_quantity
      ) {
        toast.error(
          'Vui lòng nhập thêm hàng'
        )

        return prev
      }

      return prev.map((l) =>
        l.product.id === p.id
          ? {
              ...l,
              quantity: l.quantity + 1,
            }
          : l
      )
    }

    return [
      ...prev,
      {
        product: p,
        quantity: 1,
        price: p.sale_price,
      },
    ]
  })
}

    const updateQty = (id: string, delta: number) =>
      setCart((prev) =>
        prev
          .map((l) =>
            l.product.id === id
              ? { ...l, quantity: Math.max(0, l.quantity + delta) }
              : l,
          )
          .filter((l) => l.quantity > 0),
      )

    const updatePrice = (id: string, price: number) =>
      setCart((prev) =>
        prev.map((l) => (l.product.id === id ? { ...l, price } : l)),
      )

    const removeLine = (id: string) =>
      setCart((prev) => prev.filter((l) => l.product.id !== id))

   const subtotal = cart.reduce(
  (s, l) => s + l.price * l.quantity,
  0
)

const discountAmount =
  discountType === 'percent'
    ? Math.round(subtotal * discountValue / 100)
    : discountValue

const total =
  subtotal -
  discountAmount +
  shippingFee

    const findCustomer = async (
  keyword: string
) => {

  if (!keyword?.trim()) return

  const last4 =
    keyword.replace(/\D/g, '').slice(-4)

  console.log(
    'SEARCH CUSTOMER:',
    keyword,
    last4
  )

  const { data, error } =
    await supabase
      .from('customers')
      .select('*')
      .or(
        `customer_display_code.ilike.%${keyword}%,phone.ilike.%${last4}%`
      )
      .limit(1)
      .maybeSingle()

  console.log('CUSTOMER', data)
  console.log('ERROR', error)

  if (!data) return

  setCustomerCode(
    data.customer_display_code || ''
  )

  setCustomerTitle(
    data.customer_title === 'Chị' ? 'Chị' : 'Anh'
  )

  setCustomerSource(
    data.customer_source || 'Website'
  )

  setCustomerNote(
    data.customer_note || ''
  )

  setCustomerName(
    data.full_name || ''
  )

  setCustomerPhone(
    data.phone || ''
  )

  setCustomerAddress(
    data.address || ''
  )

  setStreetAddress(data.address || '')
}


    const updateOrder = async () => {
      if (!orderId) {
        toast.error('Không tìm thấy mã đơn hàng')
        return
      }

      if (!cart.length) {
        toast.error('Vui lòng thêm sản phẩm')
        return
      }

      try {
        const { data: currentOrder, error: currentOrderError } =
          await supabase
            .from('orders')
            .select('id, order_code, customer_id, created_at')
            .eq('id', orderId)
            .single()

        if (currentOrderError || !currentOrder) {
          toast.error(
            currentOrderError?.message || 'Không tìm thấy đơn hàng'
          )
          return
        }

        if (currentOrder.customer_id) {
          const { error: customerError } = await supabase
            .from('customers')
            .update({
              customer_title: customerTitle,
              customer_source: customerSource,
              customer_note: customerNote,
              full_name: customerName,
              phone: customerPhone,
              address: customerAddress,
            })
            .eq('id', currentOrder.customer_id)

          if (customerError) {
            console.error('CUSTOMER UPDATE ERROR', customerError)
            toast.error(customerError.message)
            return
          }
        }

        const paid = Number(paidAmount || 0)
        const remaining = Math.max(Number(total || 0) - paid, 0)

        const { error: orderError } = await supabase
          .from('orders')
          .update({
            customer_name: customerName,
            subtotal,
            discount: discountAmount,
            shipping_fee: shippingFee,
            total_amount: total,
            paid_amount: paid,
            remaining_amount: remaining,
            payment_status:
              paid === 0
                ? 'unpaid'
                : paid >= total
                ? 'paid'
                : 'partial',
            payment_method: paymentMethod,
            shipping_provider: shippingProvider,
            shipping_method: shippingMethod,
          })
          .eq('id', orderId)

        if (orderError) {
          toast.error(orderError.message)
          return
        }

        const { error: deleteItemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId)

        if (deleteItemsError) {
          toast.error(deleteItemsError.message)
          return
        }

        const { error: itemError } = await supabase
          .from('order_items')
          .insert(
            cart.map((item) => ({
              customer_name: customerName,
              order_id: orderId,
              product_id: item.product.id,
              sku: item.product.sku,
              product_name: item.product.name,
              color: item.product.color,
              quantity: item.quantity,
              sale_price: item.price,
              subtotal: item.price * item.quantity,
            }))
          )

        if (itemError) {
          toast.error(itemError.message)
          return
        }

        setCreatedOrderCode(currentOrder.order_code || '')
        setCreatedOrderDate(
          currentOrder.created_at
            ? new Date(currentOrder.created_at).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN')
        )

        toast.success('Cập nhật đơn hàng thành công')
        setShowPrint(true)
      } catch (error: any) {
        console.error('UPDATE ORDER ERROR', error)
        toast.error(error?.message || 'Không thể cập nhật đơn hàng')
      }
    }


    const createOrder = async () => {

      console.log('CREATE ORDER')

      if (!cart.length) {
        toast.error('Vui lòng thêm sản phẩm')
        return
      }

const now = new Date()

const yy = String(now.getFullYear()).slice(-2)
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')

const totalK = Math.round(total / 1000)

const serial = Date.now().toString().slice(-4)

const orderCode = `DHOL-${yy}${mm}${dd}-${totalK}-${serial}`

let customerId: string | null = null

      const { data: existingCustomer } =
        await supabase
          .from('customers')
          .select('*')
          .eq('phone', customerPhone)
          .maybeSingle()

      if (existingCustomer) {
        customerId =
          existingCustomer.id

        const { error: customerUpdateError } =
          await supabase
            .from('customers')
            .update({
              customer_title: customerTitle,
              customer_source: customerSource,
              customer_note: customerNote,
              full_name: customerName,
              address: customerAddress,
            })
            .eq('id', existingCustomer.id)

        if (customerUpdateError) {
          console.error('CUSTOMER UPDATE ERROR', customerUpdateError)
        }
      } else {
       
        const lastName =
  customerName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(' ')
    .pop()
    ?.substring(0, 2)
    .toUpperCase() || 'KH'

const last4Phone =
  customerPhone
    .replace(/\D/g, '')
    .slice(-4)

const now = new Date()

const dd =
  String(now.getDate())
    .padStart(2, '0')

const mm =
  String(now.getMonth() + 1)
    .padStart(2, '0')

const customerCode =
`KH${dd}${mm}${lastName}${last4Phone}`     
        const {
          data: newCustomer,
          error: customerError,
        } = await supabase
          .from('customers')
          .insert([
            {
  customer_code: customerCode,

  customer_display_code: customerCode,

  full_name: customerName,

  customer_title: customerTitle,

  customer_source: customerSource,

  customer_note: customerNote,

  phone: customerPhone,

  address: customerAddress,

  total_orders: 1,

  total_spent: total,
},
          ])
          .select()
          .single()

        console.log('customerError', customerError)
        console.log('newCustomer', newCustomer)

        if (customerError) {
          alert(customerError.message)
          return
        }

        if (!newCustomer) {
          alert('newCustomer = null')
          return
        }

        customerId = newCustomer.id
      }


      console.log('ORDER VALUES', {
  total,
  paidAmount,
  remaining:
    Math.max(
      total - paidAmount,
      0
    )
})
const paid =
  Number(paidAmount || 0)

const remaining =
  Math.max(
    Number(total || 0) - paid,
    0
  )

console.log({
  paid,
  remaining,
  total
})

const {
  data: orderData,
  error,
} = await supabase
  .from('orders')
  .insert([
    {
      order_code: orderCode,

      customer_id: customerId,

      customer_name: customerName,

      subtotal: subtotal,

      discount: discountAmount,

      shipping_fee: shippingFee,

      total_amount: total,

      paid_amount: paid,

      remaining_amount: remaining,

      payment_status:
        paid === 0
          ? 'unpaid'
          : paid >= total
          ? 'paid'
          : 'partial',

      status: 'pending',

      payment_method:
        paymentMethod,

      shipping_provider:
        shippingProvider,

      shipping_method:
        shippingMethod,
    },
  ])

        .select()
        .single()

      if (error) {
        console.log(error)
        alert(error.message)
        toast.error(error.message)
        return
      }

      const { error: itemError } =
        await supabase
          .from('order_items')
          .insert(
            cart.map((item) => ({
  customer_name: customerName,
  order_id: orderData.id,

  product_id: item.product.id,

  sku:
  item.product.sku,

product_name:
  item.product.name,

  color:
    item.product.color,

  quantity:
    item.quantity,

  sale_price:
    item.price,

  subtotal:
    item.price * item.quantity,
}))
          )

      console.log('itemError', itemError)
      console.log('orderData', orderData)
      console.log('cart', cart)

      for (const item of cart) {

        const newStock =
          (item.product.stock_quantity || 0) -
          item.quantity

        const { error: stockError } =
          await supabase
            .from('products')
            .update({
              stock_quantity: newStock,
            })
            .eq('id', item.product.id)

        if (stockError) {
          console.error(stockError)
          continue
        }

        console.log(
          'CREATE SALE LOG',
          orderCode,
          item.sku
        )

        const { error: logError } =
          await supabase
            .from('inventory_transactions')
            .insert({
              product_id: item.product.id,
              sku: item.product.sku,
              transaction_type: 'SALE',
              quantity: item.quantity,
              stock_after: newStock,
              reference_type: 'ORDER',
              reference_id: orderCode,
              created_by: 'ADMIN',
              note: `Bán hàng - Đơn ${orderCode}`,
            })

        console.log(
          'SALE CREATED',
          orderCode
        )

        if (logError) {
          console.error('LOG ERROR', logError)
          alert(JSON.stringify(logError))
        } else {
          console.log(
            'SALE LOG CREATED',
            orderCode
          )
        }
      }

      setCreatedOrderCode(orderCode)
      setCreatedOrderDate(now.toLocaleDateString('vi-VN'))

      toast.success(
        'Tạo đơn hàng thành công'
      )

      setShowPrint(true)

    }

    return (

  <PageShell title="Tạo đơn hàng mới">

    <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">

          {/* LEFT PANEL */}

<div className="flex min-w-0 flex-col gap-4 lg:col-span-8">

            <div >

              <div className="mb-3 flex w-full items-center gap-2 sm:mb-4 sm:gap-3">

  {/* TÌM KIẾM */}
  <div className="relative min-w-0 flex-1">

    <Search
      size={16}
      className="
        absolute
        left-3
        top-1/2
        -translate-y-1/2
        text-slate-400
      "
    />

    <input
      placeholder="Tìm SKU hoặc tên sản phẩm..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      className="
        h-11
        w-full
        rounded-xl
        border
        border-slate-700
        bg-slate-900
        py-2.5
        pl-10
        pr-3
        text-sm
        text-white
        outline-none
        placeholder:text-slate-500
        focus:border-cyan-500
        focus:ring-1
        focus:ring-cyan-500/30
        sm:h-12
        sm:pl-11
      "
    />

  </div>

  {/* TẤT CẢ SẢN PHẨM */}
  <select
    value={selectedProduct}
    onChange={(e) =>
      setSelectedProduct(e.target.value)
    }
    className="
      h-11
      w-[110px]
      shrink-0
      rounded-xl
      border
      border-slate-700
      bg-slate-900
      px-2.5
      text-[12px]
      font-medium
      text-white
      outline-none
      focus:border-cyan-500
      sm:h-12
      sm:w-64
      sm:px-3
      sm:text-sm
    "
  >
    <option value="all">
      Tất cả SP
    </option>

    {[
      ...new Set(
        productsData.map(
          (x) => x.name
        )
      ),
    ].map((name) => (
      <option
        key={name}
        value={name}
      >
        {name}
      </option>
    ))}
  </select>

</div>

              <div className="mb-2 flex items-center justify-between gap-2 sm:mb-4 sm:flex-row">

                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 sm:px-3 sm:py-1 sm:text-sm">
                  {productsData.length} sản phẩm
                </span>

               <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

  <button
    onClick={() => setStockFilter('all')}
    className={`min-h-9 rounded-full px-3 py-1.5 text-[10px] font-medium sm:px-4 sm:py-2 sm:text-sm ${
      stockFilter === 'all'
        ? 'bg-cyan-500 text-white'
        : 'bg-slate-800 text-slate-300'
    }`}
  >
    Tất cả
  </button>

  <button
    onClick={() => setStockFilter('active')}
    className={`min-h-9 rounded-full px-3 py-1.5 text-[10px] font-medium sm:px-4 sm:py-2 sm:text-sm ${
      stockFilter === 'active'
        ? 'bg-green-500 text-white'
        : 'bg-slate-800 text-slate-300'
    }`}
  >
    Còn hàng
  </button>

  <button
    onClick={() => setStockFilter('low')}
    className={`min-h-9 rounded-full px-3 py-1.5 text-[10px] font-medium sm:px-4 sm:py-2 sm:text-sm ${
      stockFilter === 'low'
        ? 'bg-yellow-500 text-black'
        : 'bg-slate-800 text-slate-300'
    }`}
  >
    Sắp hết
  </button>

  <button
    onClick={() => setStockFilter('out')}
    className={`min-h-9 rounded-full px-3 py-1.5 text-[10px] font-medium sm:px-4 sm:py-2 sm:text-sm ${
      stockFilter === 'out'
        ? 'bg-red-500 text-white'
        : 'bg-slate-800 text-slate-300'
    }`}
  >
    Hết hàng
  </button>

</div>


              </div>

            </div>

       <div
  className="
    -mt-2
    h-[260px] min-h-0 max-h-[260px]
    overflow-y-auto
    sm:h-[300px]
    sm:max-h-[300px]
    lg:h-[300px]
    lg:max-h-[300px]
    rounded-md
    border
    border-slate-800
    custom-scroll
  "
>

  <div
    className="
      sticky
      top-0
      z-10
      hidden
      sm:grid
      grid-cols-12
      border-b
      border-slate-700
      bg-slate-950
      px-4
      py-3
      text-xs
      font-bold
      uppercase
      tracking-wide
      text-slate-400
    "
  >
    <div className="col-span-5">
      Sản phẩm
    </div>

    <div className="col-span-3 text-center">
      Giá tiền
    </div>

    <div className="col-span-2 text-center">
      SL
    </div>

    <div className="col-span-2 text-center">
      Thêm SP
    </div>
  </div>

   {(showAllProducts
      ? displayedProducts
      : displayedProducts.slice(0, 4)
    ).map((item) => (

  <div
    key={item.id}
    className="
      grid
      grid-cols-[minmax(0,1fr)_auto]
      items-center
      gap-2
      border-b
      border-slate-800
      px-2.5
      py-2
      hover:bg-slate-900/40
      sm:grid-cols-12
      sm:gap-0
      sm:px-4
      sm:py-2.5
    "
  >
    {/* PRODUCT */}
    <div className="min-w-0 flex items-center gap-2.5 sm:col-span-5 sm:gap-4">
      <img
        src={item.image_url || '/placeholder-product.png'}
        className="
          h-10
          w-10
          shrink-0
          rounded-lg
          object-cover
          sm:h-14
          sm:w-14
        "
        alt=""
      />

      <div className="min-w-0">
        <div className="break-words text-[12px] font-semibold leading-4 sm:text-base sm:leading-5">
          {getBaseProductName(item.name)}
        </div>

        <div className="mt-1">
          {Number(item.stock_quantity) > 5 && (
            <span className="inline-flex rounded-full bg-green-500/15 px-1.5 py-0.5 text-[9px] text-green-400 sm:px-2 sm:py-1 sm:text-[10px]">
              Còn hàng
            </span>
          )}

          {Number(item.stock_quantity) > 0 &&
            Number(item.stock_quantity) <= 5 && (
              <span className="inline-flex rounded-full bg-yellow-500/15 px-1.5 py-0.5 text-[9px] text-yellow-400 sm:px-2 sm:py-1 sm:text-[10px]">
                Sắp hết
              </span>
            )}

          {Number(item.stock_quantity) <= 0 && (
            <span className="inline-flex rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] text-red-400 sm:px-2 sm:py-1 sm:text-[10px]">
              Hết hàng
            </span>
          )}
        </div>

        <div className="mt-0.5 truncate text-[8px] leading-3 text-slate-500 sm:text-sm sm:text-slate-400">
          {item.sku}
        </div>
      </div>
    </div>

    {/* MOBILE: price + actions stay together with guaranteed spacing.
        DESKTOP: wrapper becomes grid contents so the desktop columns remain. */}
    <div className="flex shrink-0 items-center justify-end gap-1.5 sm:contents">
      {/* PRICE */}
      <div
        className="
          min-w-[78px]
          whitespace-nowrap
          text-right
          text-[11px]
          font-extrabold
          leading-5
          text-cyan-400
          sm:col-span-3
          sm:min-w-0
          sm:pl-0
          sm:text-center
          sm:text-[12px]
        "
      >
        {Number(item.sale_price).toLocaleString('vi-VN')} đ
      </div>

      {/* STOCK - desktop only */}
      <div className="hidden sm:col-span-2 sm:flex sm:items-center sm:justify-center">
        <span
          className="
            rounded-full
            border
            border-cyan-500/40
            bg-cyan-500/20
            px-2
            py-0.5
            text-[10px]
            font-bold
            text-cyan-300
          "
        >
          {item.stock_quantity}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:col-span-2 sm:justify-end">
        {/* NHẬP KHO NHANH */}
        {Number(item.stock_quantity) <= 5 ? (
          <button
            type="button"
            onClick={() => {
              router.push(
                `/kho-hang/nhap-kho?productId=${encodeURIComponent(
                  item.id
                )}&sku=${encodeURIComponent(item.sku || '')}`
              )
            }}
            className="
              flex
              h-9
              min-w-[42px]
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-yellow-500/40
              bg-yellow-500/10
              px-2
              text-[9px]
              font-bold
              text-yellow-400
              transition
              hover:bg-yellow-500/20
              active:scale-95
              sm:h-8
              sm:min-w-0
              sm:px-2
              sm:text-[10px]
            "
            title="Nhập kho nhanh"
            aria-label={`Nhập kho ${item.name || item.sku || ''}`}
          >
            <span className="sm:hidden">Nhập</span>
            <span className="hidden sm:inline">Nhập kho</span>
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="hidden h-8 min-w-[68px] shrink-0 sm:block"
          />
        )}

        {/* THÊM SẢN PHẨM */}
        <button
          type="button"
          onClick={() => addToCart(item)}
          disabled={Number(item.stock_quantity) <= 0}
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-cyan-500
            text-base
            font-bold
            text-white
            transition
            hover:bg-cyan-400
            active:scale-95
            disabled:cursor-not-allowed
            disabled:opacity-40
            sm:h-9
            sm:w-9
            sm:rounded-lg
            sm:text-sm
          "
          title="Thêm vào giỏ"
          aria-label={`Thêm ${item.name || item.sku || ''} vào giỏ`}
        >
          +
        </button>
      </div>
    </div>
  </div>
))}
</div>


{/* MOBILE PRODUCT LIST TOGGLE */}
<div className="flex h-7 items-center justify-center sm:hidden">
  {displayedProducts.length > 4 && (
    <button
      type="button"
      onClick={() => setShowAllProducts((prev) => !prev)}
      className="px-3 py-0.5 text-[10px] font-medium text-cyan-400 hover:text-cyan-300"
    >
      {showAllProducts
        ? 'Thu gọn sản phẩm ↑'
        : `Xem thêm ${displayedProducts.length - 4} sản phẩm ↓`}
    </button>
  )}
</div>

{/* CART */}

<div
 className="
mt-2
rounded-xl
border
border-slate-800
bg-slate-900/50
p-2
sm:mt-3
sm:p-3
"
>

  <div className="mb-2 flex items-center justify-between gap-2 sm:mb-4 sm:flex-row">

  <h2 className="text-sm font-bold sm:text-xl">
    Giỏ hàng (
    {cart.reduce(
      (s, item) => s + item.quantity,
      0
    )}
    )
  </h2>

  {cart.length > 0 && (
    <button
      onClick={() => setCart([])}
      className="
        rounded-md
        border
        border-red-500/40
        px-2
        py-1
        whitespace-nowrap
        text-[9px]
        sm:px-3
        sm:py-2
        sm:text-sm
        text-red-400
        hover:bg-red-500/10
      "
    >
      🗑 Xóa tất cả
    </button>
  )}

</div>

  {cart.length === 0 ? (

    <div className="text-center text-slate-500">
      Chưa có sản phẩm
    </div>

  ) : (

    <div className="space-y-1 sm:space-y-3">

      {cart.map((item) => (

        <div
          key={item.product.id}
          className="
            flex
            min-w-0
            items-center
            gap-1.5
            rounded-lg
            border
            border-slate-800
            px-1.5
            py-1.5
            sm:gap-3
            sm:p-3
          "
        >

          {/* ẢNH */}
          <img
            src={
              item.product.image_url ||
              '/placeholder-product.png'
            }
            className="
              h-8
              w-8
              shrink-0
              rounded-md
              object-cover
              sm:h-16
              sm:w-16
            "
            alt=""
          />

          {/* TÊN + SKU */}
<div className="min-w-0 flex-1">

  <div
    className="
      break-words
      text-[12px]
      font-bold
      leading-[15px]
      text-white
      sm:text-base
      sm:leading-5
    "
  >
    {getBaseProductName(item.product.name)}
  </div>

  <div
    className="
      mt-0.5
      break-all
      text-[8px]
      leading-3
      text-slate-500
      sm:text-xs
      sm:text-slate-400
    "
  >
    {item.product.sku}
  </div>

</div>

          {/* MÀU */}
          {item.product.color && (
            <span className="
              hidden
              shrink-0
              rounded-full
              bg-cyan-500/15
              px-1.5
              py-0.5
              text-[8px]
              text-cyan-300
              sm:inline-flex
              sm:text-[9px]
            ">
              {item.product.color}
            </span>
          )}

          {/* GIÁ */}
<span
  className="
    shrink-0
    whitespace-nowrap
    text-[14px]
    font-bold
    leading-5
    text-cyan-400
    sm:text-base
  "
>
  {item.price.toLocaleString('vi-VN')} đ
</span>

          {/* SỐ LƯỢNG */}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() =>
                updateQty(item.product.id, -1)
              }
              aria-label="Giảm số lượng"
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-md
                bg-slate-700
                text-sm
                font-bold
                leading-none
                transition
                active:scale-95
                sm:h-8
                sm:w-8
                sm:rounded-md
                sm:text-sm
              "
            >
              −
            </button>

            <span className="
              min-w-[20px]
              text-center
              text-[12px]
              font-semibold
              tabular-nums
              sm:min-w-[24px]
              sm:text-sm
            ">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                updateQty(item.product.id, 1)
              }
              aria-label="Tăng số lượng"
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-md
                bg-slate-700
                text-sm
                font-bold
                leading-none
                transition
                active:scale-95
                sm:h-8
                sm:w-8
                sm:rounded-md
                sm:text-sm
              "
            >
              +
            </button>
          </div>

          {/* XÓA */}
          <button
            type="button"
            onClick={() =>
              removeLine(item.product.id)
            }
            aria-label="Xóa sản phẩm"
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-md
              bg-red-500
              text-sm
              font-bold
              leading-none
              text-white
              transition
              hover:bg-red-400
              active:scale-95
              sm:h-8
              sm:w-8
              sm:rounded-md
              sm:text-sm
            "
          >
            ×
          </button>

        </div>

      ))}

      <div className="mt-1.5 border-t border-slate-700 pt-1.5 sm:mt-2 sm:pt-2">

        <div className="flex justify-between text-sm font-semibold sm:mt-2 sm:text-[17px]">
          <span>Tạm tính</span>
          <span>
            {subtotal.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="mt-1 flex justify-between text-sm font-bold text-green-400 sm:mt-2">
          <span>Tổng</span>
          <span>
            {total.toLocaleString('vi-VN')} đ
          </span>
        </div>

      </div>

    </div>

  )}

</div>

</div>

{/* RIGHT SIDEBAR */}

<div className="min-w-0 scroll-mt-4 border-t border-slate-800 pt-4 lg:col-span-4 lg:border-0 lg:pt-0">

  <div
    className="
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      p-2
      sm:p-5
      lg:sticky
      lg:top-4
      shadow-lg
    "
    style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
  >

  <div className="space-y-2 sm:space-y-4">
              <h2 className="mb-2 text-sm font-bold sm:mb-3 sm:text-xl">
  Thông Tin Khách hàng
</h2>

  <div className="relative">

  <input
    placeholder="Mã KH hoặc 4 số cuối SĐT"
    value={customerCode}
    onChange={(e) =>
      setCustomerCode(e.target.value)
    }
    onBlur={() =>
      findCustomer(customerCode)
    }
    className="
      h-9
      w-full
      rounded-md
      border
      border-cyan-700
      bg-slate-900
      px-2.5
      py-1.5
      text-sm
      leading-none
      text-cyan-400
      sm:h-11
      sm:px-3
      sm:py-2
      font-semibold
      placeholder:text-cyan-500/70
    "
  />

</div>

{customerCode && (

  <div
    className="
      mt-2
      inline-flex
      rounded-full
      bg-cyan-500/20
      px-3
      py-1
      text-xs
      font-semibold
      text-cyan-400
    "
  >
    {customerCode}
  </div>

)}

<div className="mt-3 grid grid-cols-[104px_1fr] gap-2">
  <div>
    <label className="mb-1 block text-[11px] font-medium text-slate-400">
      Danh xưng
    </label>

    <div className="grid grid-cols-2 gap-1.5">
      {(['Anh', 'Chị'] as const).map((title) => (
        <button
          key={title}
          type="button"
          onClick={() => setCustomerTitle(title)}
          className={`
            h-9
            rounded-lg
            border
            text-sm
            font-bold
            transition
            active:scale-95
            ${
              customerTitle === title
                ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
            }
          `}
          aria-pressed={customerTitle === title}
        >
          {title}
        </button>
      ))}
    </div>
  </div>

  <div className="relative">
    <label className="mb-1 block text-[11px] font-medium text-slate-400">
      Tên khách hàng
    </label>
    <User
      size={15}
      className="absolute left-4 top-[39px] -translate-y-1/2 text-slate-400"
    />
    <input
      placeholder="Tên khách hàng"
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
      className="uppercase h-9 w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 pl-12 pr-4 text-sm outline-none focus:border-cyan-500 sm:h-11 sm:py-3"
    />
  </div>
</div>

             <div className="relative">

  <Phone
    size={15}
    className="
      absolute
      left-4
      top-1/2
      -translate-y-1/2
      text-slate-400
    "
  />

  <input
    placeholder="Số điện thoại"
    value={customerPhone}
    onChange={(e) =>
      setCustomerPhone(e.target.value)
    }
    className="
      mt-1.5
      w-full
      rounded-md
      border
      border-slate-700
      bg-slate-900
      h-9
      py-1.5
      pl-10
      pr-3
      text-sm
      sm:mt-2
      sm:h-11
      sm:py-2.5
      sm:pl-12
      sm:pr-4
      sm:text-sm
    "
  />

</div>

<div className="mt-3">
  <label className="mb-1 block text-[11px] font-medium text-slate-400">
    Nguồn khách hàng
  </label>

  <div className="grid grid-cols-4 gap-1.5">
    {[
      { value: 'Facebook', label: 'FB' },
      { value: 'TikTok', label: 'TikTok' },
      { value: 'Zalo', label: 'Zalo' },
      { value: 'Website', label: 'Website' },
    ].map((source) => (
      <button
        key={source.value}
        type="button"
        onClick={() => setCustomerSource(source.value)}
        className={`
          h-9
          rounded-lg
          border
          px-1
          text-[11px]
          font-semibold
          transition
          active:scale-95
          ${
            customerSource === source.value
              ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
              : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
          }
        `}
        aria-pressed={customerSource === source.value}
      >
        {source.label}
      </button>
    ))}
  </div>
</div>

<div className="mt-3 mb-3">
  <label className="mb-1 block text-[11px] font-medium text-slate-400">Take note</label>
  <textarea
    value={customerNote}
    onChange={(e) => setCustomerNote(e.target.value)}
    placeholder="Ghi chú về khách hàng..."
    rows={2}
    className="w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
  />
</div>

              {/* ADDRESS */}

              <div className="mb-3 space-y-1.5 sm:mb-5 sm:space-y-2.5">

                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Địa chỉ giao hàng
                  </span>

                  {addressLoading && (
                    <span className="text-[10px] text-slate-500">
                      Đang tải...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

                  <div className="relative">
  <button
    type="button"
    onClick={() => {
      setProvinceOpen((open) => !open)
      setProvinceSearch('')
    }}
    className="flex h-9 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-left text-xs text-white outline-none transition hover:border-slate-600 focus:border-cyan-500 sm:h-11 sm:px-3 sm:py-3 sm:text-sm"
  >
    <span className={selectedProvince ? 'text-white' : 'text-slate-400'}>
      {provinces.find(
        (province) =>
          String(province.code) === String(selectedProvince)
      )?.name || 'Tỉnh / TP'}
    </span>

    <ChevronDown
      size={16}
      className={`shrink-0 text-slate-400 transition-transform ${
        provinceOpen ? 'rotate-180' : ''
      }`}
    />
  </button>

  {provinceOpen && (
    <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
      <div className="border-b border-slate-800 p-2">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            autoFocus
            value={provinceSearch}
            onChange={(e) => setProvinceSearch(e.target.value)}
            placeholder="Tìm nhanh tỉnh / thành phố..."
            className="min-h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 pl-8 text-xs sm:min-h-10 sm:px-3 sm:pl-9 sm:text-sm text-white outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto p-1">
        {filteredProvinces.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-slate-500">
            Không tìm thấy tỉnh / thành phố
          </div>
        ) : (
          filteredProvinces.map((province) => (
            <button
              key={province.code}
              type="button"
              onClick={() => {
                setSelectedProvince(String(province.code))
                setProvinceOpen(false)
                setProvinceSearch('')
              }}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-slate-800 ${
                String(province.code) === String(selectedProvince)
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-200'
              }`}
            >
              {province.name}
            </button>
          ))
        )}
      </div>
    </div>
  )}
</div>

                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedProvince}
                    className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-40 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 sm:h-11 sm:px-3 sm:py-3 sm:text-sm"
                  >
                    <option value="">Quận / Huyện</option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    disabled={!selectedDistrict}
                    className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-40 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 sm:h-11 sm:px-3 sm:py-3 sm:text-sm"
                  >
                    <option value="">Phường / Xã</option>
                    {wards.map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name}
                      </option>
                    ))}
                  </select>

                </div>

                <input
                  placeholder="Số nhà, tên đường / căn hộ"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value.toUpperCase())}
                  className="uppercase h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 sm:h-11 sm:px-3 sm:py-3 sm:text-sm"
                />

                {customerAddress && (
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 px-2.5 py-1.5 text-[10px] leading-4 sm:px-3 sm:py-2 sm:text-[11px] sm:leading-5 text-slate-400">
                    <span className="mr-1 font-medium text-slate-500">
                      Địa chỉ đầy đủ:
                    </span>
                    {customerAddress}
                  </div>
                )}

              </div>

</div>

{/* PAYMENT */}

<div
  className="rounded-xl border border-slate-700 bg-slate-900 p-2 sm:p-5"
  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
>
  
  <div className="space-y-1.5 sm:space-y-2">

    <h2 className="mb-1.5 text-sm font-semibold sm:mb-2 sm:text-lg">
  Thanh toán
</h2>

    {/* Giảm giá */}

   <div>

  <label className="text-xs text-slate-400">
    Giảm giá
  </label>

  <div className="mt-1 flex gap-2">

    <input
      type="number"
      value={discountValue}
      onChange={(e) =>
        setDiscountValue(Number(e.target.value))
      }
      placeholder="0"
      className="
        flex-1
        h-9
        rounded-md
        border
        border-slate-700
        bg-slate-900
        px-2.5
        py-1.5
        text-sm
        sm:h-11
        sm:px-3
        sm:py-2
      "
    />

    <select
      value={discountType}
      onChange={(e) =>
        setDiscountType(
          e.target.value as 'amount' | 'percent'
        )
      }
      className="
        h-9
        w-20
        rounded-md
        border
        border-slate-700
        bg-slate-900
        px-2
        py-1.5
        text-sm
        sm:h-11
        sm:w-24
        sm:px-3
        sm:py-2
      "
    >
      <option value="amount">VNĐ</option>
      <option value="percent">%</option>
    </select>

  </div>

</div>
    {/* Ship */}

    <div>
      <label className="text-xs text-slate-400">
        Phí ship
      </label>

      <input
        type="number"
        value={shippingFee}
        onChange={(e) =>
          setShippingFee(Number(e.target.value))
        }
        className="mt-0.5 h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm sm:mt-1 sm:h-11 sm:px-3 sm:py-2.5 sm:text-sm"
      />
    </div>

    {/* Thanh toán */}

    <div>
      <label className="text-xs text-slate-400">
        Phương thức thanh toán
      </label>

      <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          { value: 'cash', label: 'Tiền mặt' },
          { value: 'bank', label: 'Chuyển khoản' },
          { value: 'cod', label: 'COD' },
          { value: 'momo', label: 'MoMo' },
        ].map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => setPaymentMethod(method.value)}
            className={`
              h-9
              rounded-lg
              border
              px-2
              text-[11px]
              font-semibold
              transition
              active:scale-[0.98]
              sm:h-11
              sm:text-xs
              ${
                paymentMethod === method.value
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }
            `}
            aria-pressed={paymentMethod === method.value}
          >
            {method.label}
          </button>
        ))}
      </div>
    </div>

    {/* ĐVVC */}

    <div>
      <label className="text-xs text-slate-400">
        Đơn vị vận chuyển
      </label>

      <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          { value: 'GHN', label: 'GHN' },
          { value: 'GHTK', label: 'GHTK' },
          { value: 'J&T', label: 'J&T' },
          { value: 'Viettel', label: 'Viettel' },
        ].map((provider) => (
          <button
            key={provider.value}
            type="button"
            onClick={() => setShippingProvider(provider.value)}
            className={`
              h-9
              rounded-lg
              border
              px-2
              text-[11px]
              font-semibold
              transition
              active:scale-[0.98]
              sm:h-11
              sm:text-xs
              ${
                shippingProvider === provider.value
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }
            `}
            aria-pressed={shippingProvider === provider.value}
          >
            {provider.label}
          </button>
        ))}
      </div>
    </div>

    {/* HÌNH THỨC VẬN CHUYỂN */}

    <div className="mt-3">
      <label className="text-xs text-slate-400">
        Hình thức vận chuyển
      </label>

      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {[
          { value: 'standard', label: 'GH Tiêu Chuẩn' },
          { value: 'express', label: 'Giao Hỏa Tốc' },
        ].map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => setShippingMethod(method.value)}
            className={`
              h-9
              rounded-lg
              border
              px-2
              text-[11px]
              font-semibold
              transition
              active:scale-[0.98]
              sm:h-11
              sm:text-xs
              ${
                shippingMethod === method.value
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }
            `}
            aria-pressed={shippingMethod === method.value}
          >
            {method.label}
          </button>
        ))}
      </div>
    </div>

    {/* Đã thu */}
    
  <label className="text-xs text-slate-400">
    Đã thu trước
  </label>

  <input
    type="number"
    value={paidAmount}
    onChange={(e) =>
      setPaidAmount(Number(e.target.value))
    }
    className="mt-1 h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm sm:h-11 sm:py-2.5"
  />
</div>

{/* TOTAL */}

<div className="mt-3 rounded-md border border-slate-800 bg-slate-900/40 p-2.5 sm:mt-6 sm:p-4">
  <div className="flex justify-between">
    <span>Tạm tính</span>
    <span>
      {subtotal.toLocaleString('vi-VN')} đ
    </span>
  </div>

  <div className="mt-1.5 flex justify-between text-sm sm:mt-3">
    <span>Giảm giá</span>
    <span>
      {discountAmount.toLocaleString('vi-VN')} đ
    </span>
  </div>

  <div className="mt-1.5 flex justify-between text-sm sm:mt-3">
    <span>Phí ship</span>
    <span>
      {shippingFee.toLocaleString('vi-VN')} đ
    </span>
  </div>

  <div className="my-2 border-t border-slate-700 sm:my-4" />

  <div className="flex justify-between text-green-400 text-1xl font-bold">
    <span>Thành Tiền</span>
    <span>
      {total.toLocaleString('vi-VN')} đ
    </span>
  </div>

  <div className="flex justify-between text-blue-400 text-1xl font-bold">
    <span>Còn Lại</span>
    <span>
      {Math.max(total - paidAmount, 0).toLocaleString('vi-VN')} đ
    </span>
  </div>

  <button
    onClick={() => setShowConfirm(true)}
    className="
      mt-3
      w-full
      rounded-md
      bg-cyan-500
      py-3
      text-base
      sm:mt-6
      sm:py-4
      sm:text-lg
      font-bold
      text-white
    "
  >
    Xác nhận tạo đơn
  </button>

</div>

</div>

</div>

       </div> 
        
        {showConfirm && (

<div
  className="
    fixed
    inset-0
    z-[9999]
    flex
    items-center
    justify-center
    bg-black/70
    p-4
  "
>

 <div
  className="
      w-full
      max-w-[420px]
      rounded-2xl
      border
      border-slate-700
      bg-slate-950
      p-5
      shadow-2xl
"
>

    <h2 className="mb-2 text-center text-xl font-semibold">
      Xác nhận tạo đơn
    </h2>

    <p className="mb-5 text-center text-sm text-slate-400">
      Kiểm tra lại thông tin trước khi tạo đơn hàng
    </p>

              <p className="mb-6 text-center text-slate-300">
                Khách hàng:
                <span className="ml-2 font-semibold">
                  {customerName}
                </span>
              </p>

              <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                <button
                  onClick={() =>
                    setShowConfirm(false)
                  }
                  className="
flex-1
rounded-md
border
border-slate-600
bg-slate-800
py-2.5
text-sm
font-medium
hover:bg-slate-700
"
                >
                  Hủy
                </button>

                <button

onClick={() => {

    setShowConfirm(false)

    if (isEdit) {

        updateOrder()

    } else {

        createOrder()

    }

}}
                  className="
flex-1
rounded-md
bg-cyan-500
py-2.5
text-sm
font-semibold
text-white
hover:bg-cyan-600
"
                >
                  Xác nhận
                </button>

              </div>

            </div>

          </div>

        )}

        {showPrint && (

          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black/70 p-2 sm:p-4"
            style={{ overscrollBehavior: 'none' }}
          >

    <div
  id="invoice-print"
  className="
    mx-auto
    flex
    min-h-0
    h-auto
    max-h-none
    w-full
    max-w-[210mm]
    flex-1
    flex-col
    overflow-hidden
    rounded-xl
    bg-white
    text-black
    shadow-2xl

  "
  style={{
    padding: "12mm",
    minHeight: 0,
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "11px",
    lineHeight: "1.4",
  }}
>
  <div className="invoice-scroll min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="invoice-content px-4 py-5 sm:p-[12mm]">
{/* HEADER */}

<div className="invoice-header flex items-start justify-between border-b border-black pb-4">

  {/* LEFT */}

  <div className="flex-1">

    <h1
      className="text-[26px] font-bold tracking-[3px]"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      OLIVE LIVING
    </h1>

    <div
      className="mt-3 text-[11px] leading-5 text-gray-700"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div>Địa chỉ: KDC Khang Điền Bình Chánh, Đường Trịnh Quang Nghị, X. Phong Phú, H. Bình Chánh. HCM</div>

      <div>Hotline: +84 79 937 9179</div>

      <div>Email: hello@olivelivingvn.com</div>

      <div>Website: oliveliving.vn</div>
    </div>

  </div>

  {/* RIGHT */}

  <div className="ml-8 flex items-center justify-end">

    <Image
      src="/logo.png"
      alt="Olive Living"
      width={120}
      height={120}
      className="object-contain"
    />

  </div>

</div>



<div className="invoice-title py-5 text-center">

    <h2 className="text-[22px] font-bold">
        HÓA ĐƠN BÁN HÀNG
    </h2>

</div>

              
    
              {/* ORDER INFO */}

<div
  className="invoice-order-info mt-3 border-y border-gray-300 py-2.5 text-[11px] leading-5"
  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
>
  <div>
    <strong>Mã đơn:</strong>{' '}
    <span style={{ fontFamily: '"Pixel Operator", "Pixeloid Sans", "Silkscreen", "Press Start 2P", "Courier New", monospace', fontSize: '10px', letterSpacing: '0.2px', color: '#111827' }}>
      {createdOrderCode || '-'}
    </span>
  </div>
  <div>
    <strong>Ngày:</strong>{' '}
    <span style={{ fontFamily: '"Pixel Operator", "Pixeloid Sans", "Silkscreen", "Press Start 2P", "Courier New", monospace', fontSize: '10px', letterSpacing: '0.2px', color: '#111827' }}>
      {createdOrderDate || '-'}
    </span>
  </div>
  <div>
    <strong>Mã KH:</strong>{' '}
    <span style={{ fontFamily: '"Pixel Operator", "Pixeloid Sans", "Silkscreen", "Press Start 2P", "Courier New", monospace', fontSize: '10px', letterSpacing: '0.2px', color: '#111827' }}>
      {customerCode || '-'}
    </span>
  </div>
</div>

{/* CUSTOMER INFO */}

<div
  className="invoice-customer mt-3 border-b border-gray-300 pb-3 text-[11px] leading-4"
  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
>
  <div className="mb-1 border-b pb-1 font-bold">
    THÔNG TIN KHÁCH HÀNG
  </div>

  <div className="invoice-customer-grid grid grid-cols-2 gap-x-6 gap-y-1.5">
    <div><strong>Khách hàng:</strong> {customerTitle} {customerName || '-'}</div>
    <div><strong>SĐT:</strong> {customerPhone || '-'}</div>
    <div><strong>Nguồn:</strong> {customerSource || '-'}</div>
    <div><strong>ĐVVC:</strong> {shippingProvider || '-'}</div>
    <div><strong>Hình thức:</strong> {shippingMethod === 'express' ? 'Giao Hỏa Tốc' : 'GH Tiêu Chuẩn'}</div>
    <div><strong>Thanh toán:</strong> {paymentMethod || '-'}</div>
    <div><strong>Đã thanh toán:</strong> {paidAmount.toLocaleString('vi-VN')} đ</div>
    <div style={{ gridColumn: '1 / -1' }}><strong>Địa chỉ giao hàng:</strong> {customerAddress || '-'}</div>
    <div style={{ gridColumn: '1 / -1' }}><strong>Note:</strong> {customerNote || '-'}</div>
  </div>
</div>

{/* PRODUCTS */}

<table
  className="mt-3 w-full border-collapse text-[11px]"
  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
>
  <thead>

    <tr className="border-b">

      <th className="py-1 text-left">
        SKU
      </th>

      <th className="py-1 text-left">
        Sản phẩm
      </th>

      <th className="py-1 text-center">
        Màu
      </th>

      <th className="py-1 text-center">
        SL
      </th>

      <th className="py-1 text-right">
        Đơn giá
      </th>

      <th className="py-1 text-right">
        Thành tiền
      </th>

    </tr>

  </thead>

  <tbody>

    {cart.map((item) => (

      

      <tr
        key={item.product.id}
        className="border-b"
      >

        <td className="py-[3px]">
          {item.product.sku}
        </td>

        <td className="py-[3px]">
          {item.product.name}
        </td>

        <td className="py-1 text-center">
          {item.product.color || '-'}
        </td>

        <td className="py-1 text-center">
          {item.quantity}
        </td>

        <td className="py-1 text-right">
          {item.price.toLocaleString('vi-VN')} đ
        </td>

        <td className="py-[3px] text-right font-medium">
          {(item.price * item.quantity).toLocaleString('vi-VN')} đ
        </td>

      </tr>

    ))}

  </tbody>

</table>



{/* TOTAL */}

<div className="invoice-payment-summary mt-3 ml-auto w-[280px] border-t border-b border-gray-300 py-2.5 text-[11px]">

  <div className="invoice-payment-row flex justify-between text-[11px] font-semibold">
    <span>Tạm tính</span>
    <span>{subtotal.toLocaleString('vi-VN')} đ</span>
  </div>

  <div className="invoice-payment-row flex justify-between text-[11px] font-normal">
    <span>Giảm giá</span>
    <span>{discountAmount.toLocaleString('vi-VN')} đ</span>
  </div>

 <div className="invoice-payment-row flex justify-between text-[11px] font-normal">
    <span>Phí ship</span>
    <span>{shippingFee.toLocaleString('vi-VN')} đ</span>
  </div>

 <div className="invoice-payment-row flex justify-between text-[11px] font-normal">
    <span>Đã Thanh Toán</span>
    <span>{paidAmount.toLocaleString('vi-VN')} đ</span>
  </div>

  <div className="invoice-payment-total mt-2 border-t border-black pt-2">

    <div className="invoice-grand-total mt-2 flex justify-between text-1xl font-bold text-green-600">
      <span>THÀNH TIỀN</span>
      <span>{total.toLocaleString('vi-VN')} đ</span>
    </div>

    <div className="invoice-balance mt-2 flex justify-between text-1xl font-bold text-blue-800">
      <span>CÒN LẠI</span>
      <span>
        {Math.max(total - paidAmount, 0).toLocaleString('vi-VN')} đ
      </span>
    </div>

  </div>

</div>

          
          <div
  className="invoice-policy mt-3 border-b border-gray-300 pb-3 text-[11px] leading-4"
  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
>
  <div className="mb-2 text-[11px] font-bold">
    CHÍNH SÁCH ĐỔI TRẢ
  </div>

  <p className="mb-1">
    <strong>Thời gian đổi trả:</strong> Trong vòng 15 ngày kể từ ngày ĐVVC xác nhận đơn hàng giao thành công.
  </p>

  <p className="mb-1 font-semibold">Hỗ trợ đổi:</p>
  <ul className="mb-2 ml-5 list-disc leading-5">
    <li>Lỗi sản xuất, lỗi kỹ thuật hoặc bể vỡ do vận chuyển.</li>
    <li>Sản phẩm chưa qua sử dụng, còn đầy đủ hộp, bao bì và phụ kiện.</li>
    <li>Khách hàng cung cấp hình ảnh/video khi phát hiện vấn đề.</li>
  </ul>

  <p className="mb-1 font-semibold">Không hỗ trợ đổi:</p>
  <ul className="mb-2 ml-5 list-disc leading-5">
    <li>Hư hỏng do sử dụng, lắp đặt hoặc bảo quản không đúng hướng dẫn.</li>
    <li>Bể, nứt, móp hoặc hao mòn do khách hàng.</li>
    <li>Thiếu hộp, bao bì hoặc phụ kiện làm ảnh hưởng việc kiểm tra và đổi hàng.</li>
  </ul>

  <div className="mt-2">
    <strong>Xem chi tiết chính sách:</strong>{' '}
    <a
      href="https://olivelivingvn.com/chinh-sach-doi-hang"
      target="_blank"
      rel="noreferrer"
      style={{
        color: '#4B5563',
        textDecoration: 'none',
        fontStyle: 'italic',
        fontWeight: 400,
      }}
    >
      Olivelivingvn.com/chinh-sach-doi-hang
    </a>
  </div>
</div>

              </div>
            </div>

            <div
              className="no-print z-10 flex w-full shrink-0 gap-2 border-t border-gray-200 bg-white p-2 sm:p-3"
              style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
            >
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-lg bg-green-600 py-3 text-sm font-bold text-white sm:text-base"
              >
                🖨 In hóa đơn
              </button>

              <button
                onClick={() => setShowPrint(false)}
                className="flex-1 rounded-lg bg-gray-200 py-3 text-sm font-bold text-gray-900 sm:text-base"
              >
                Đóng
              </button>
            </div>

            <style>{`
              .invoice-scroll {
                scrollbar-width: none;
                -ms-overflow-style: none;
                overscroll-behavior: contain;
              }
              .invoice-scroll::-webkit-scrollbar { display: none; }

              @media (max-width: 639px) {
                /* MOBILE-FIRST CUSTOMER BILL */
                #invoice-print {
                  width: calc(100vw - 12px) !important;
                  max-width: 430px !important;
                  height: calc(100dvh - 12px) !important;
                  max-height: calc(100dvh - 12px) !important;
                  min-height: 0 !important;
                  padding: 0 !important;
                  border-radius: 14px !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10px !important;
                  line-height: 1.3 !important;
                }

                #invoice-print .invoice-scroll {
                  flex: 1 1 auto !important;
                  min-height: 0 !important;
                  overflow: hidden !important;
                  height: auto !important;
                }

                #invoice-print .invoice-content {
                  width: 100% !important;
                  box-sizing: border-box !important;
                  padding: 16px 16px 8px !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10px !important;
                  line-height: 1.3 !important;
                }

                /* HEADER: slightly larger and better balanced */
                #invoice-print .invoice-header {
                  padding-bottom: 8px !important;
                  align-items: flex-start !important;
                }

                #invoice-print .invoice-header h1 {
                  font-size: 21px !important;
                  line-height: 1 !important;
                  letter-spacing: 2px !important;
                  white-space: nowrap !important;
                }

                #invoice-print .invoice-header img {
                  width: 68px !important;
                  height: 68px !important;
                }

                #invoice-print .invoice-header .mt-3 {
                  margin-top: 7px !important;
                  font-size: 8px !important;
                  line-height: 1.45 !important;
                }

                #invoice-print .invoice-header .ml-8 {
                  margin-left: 10px !important;
                }

                /* TITLE */
                #invoice-print .invoice-title {
                  padding: 9px 0 8px !important;
                }

                #invoice-print .invoice-title h2 {
                  font-size: 18px !important;
                  line-height: 1.1 !important;
                  letter-spacing: .2px !important;
                }

                /* ORDER / CUSTOMER cards */
                #invoice-print .invoice-order-info,
                #invoice-print .invoice-customer {
                  margin-top: 7px !important;
                  padding: 7px 0 !important;
                  border-radius: 0 !important;
                  background: transparent !important;
                  font-size: 9px !important;
                  line-height: 1.35 !important;
                }

                #invoice-print .invoice-customer .mb-1 {
                  margin-bottom: 5px !important;
                  padding-bottom: 4px !important;
                  font-size: 9px !important;
                  letter-spacing: .2px !important;
                }

                #invoice-print .invoice-customer-grid {
                  grid-template-columns: 1fr 1fr !important;
                  column-gap: 12px !important;
                  row-gap: 3px !important;
                }

                /* Address gets full width so it never becomes a tall narrow column. */
                #invoice-print .invoice-customer-grid .invoice-address {
                  grid-column: 1 / -1 !important;
                  order: 2 !important;
                  margin-top: 2px !important;
                }

                /* PRODUCTS */
                #invoice-print .invoice-content table {
                  table-layout: fixed !important;
                  width: 100% !important;
                  margin-top: 9px !important;
                  font-size: 8.5px !important;
                }

                #invoice-print .invoice-content th,
                #invoice-print .invoice-content td {
                  padding: 4px 2px !important;
                  line-height: 1.2 !important;
                  overflow-wrap: anywhere !important;
                }

                #invoice-print .invoice-content th:nth-child(3),
                #invoice-print .invoice-content td:nth-child(3),
                #invoice-print .invoice-content th:nth-child(5),
                #invoice-print .invoice-content td:nth-child(5) {
                  display: none !important;
                }

                #invoice-print .invoice-content th:nth-child(1),
                #invoice-print .invoice-content td:nth-child(1) { width: 25% !important; }
                #invoice-print .invoice-content th:nth-child(2),
                #invoice-print .invoice-content td:nth-child(2) { width: 37% !important; }
                #invoice-print .invoice-content th:nth-child(4),
                #invoice-print .invoice-content td:nth-child(4) { width: 10% !important; text-align:center !important; }
                #invoice-print .invoice-content th:nth-child(6),
                #invoice-print .invoice-content td:nth-child(6) { width: 28% !important; }

                /* PAYMENT SUMMARY — compact card, not a giant block */
                #invoice-print .invoice-payment-summary {
                  width: 58% !important;
                  max-width: 250px !important;
                  margin-top: 8px !important;
                  padding: 7px 0 !important;
                  border-radius: 0 !important;
                  background: transparent !important;
                  font-size: 9px !important;
                }

                #invoice-print .invoice-payment-row {
                  margin-top: 0 !important;
                  padding: 2px 0 !important;
                  line-height: 1.25 !important;
                }

                #invoice-print .invoice-payment-total {
                  margin-top: 5px !important;
                  padding-top: 5px !important;
                }

                #invoice-print .invoice-grand-total,
                #invoice-print .invoice-balance {
                  margin-top: 2px !important;
                  font-size: 11px !important;
                  line-height: 1.2 !important;
                }

                /* POLICY — smaller and lighter so it doesn't dominate the bill */
                #invoice-print .invoice-policy {
                  margin-top: 9px !important;
                  padding: 8px 0 7px !important;
                  border-radius: 0 !important;
                  background: transparent !important;
                  font-size: 8.5px !important;
                  line-height: 1.3 !important;
                }

                #invoice-print .invoice-policy > div:first-child {
                  margin-bottom: 5px !important;
                  padding-bottom: 4px !important;
                  border-bottom: 0 !important;
                  font-size: 10px !important;
                  letter-spacing: .15px !important;
                }

                #invoice-print .invoice-policy p {
                  margin-bottom: 2px !important;
                }

                #invoice-print .invoice-policy ul {
                  margin: 2px 0 3px !important;
                  padding-left: 15px !important;
                  line-height: 1.3 !important;
                }

                #invoice-print .invoice-policy li {
                  margin: 0 !important;
                }

                #invoice-print .invoice-policy .mt-3 {
                  margin-top: 5px !important;
                  padding: 4px 0 0 !important;
                  font-size: 8px !important;
                  line-height: 1.25 !important;
                  border-left: 0 !important;
                }

                /* ACTION BAR — fixed footer inside modal, always visible */
                #invoice-print + .no-print {
                  flex: 0 0 auto !important;
                  padding: 7px 8px max(7px, env(safe-area-inset-bottom)) !important;
                  gap: 7px !important;
                }

                #invoice-print + .no-print button {
                  min-height: 44px !important;
                  padding: 8px 10px !important;
                  border-radius: 9px !important;
                  font-size: 12px !important;
                }
              }

              @media print {
                @page { size: A4 portrait; margin: 0; }
                html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }
                body * { visibility: hidden; }
                #invoice-print, #invoice-print * { visibility: visible; }
                #invoice-print {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  max-width: none !important;
                  max-height: none !important;
                  min-height: 297mm !important;
                  overflow: visible !important;
                  display: block !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                }
                #invoice-print .invoice-scroll { overflow: visible !important; height: auto !important; max-height: none !important; }
                #invoice-print .invoice-content { min-height: 297mm !important; padding: 12mm !important; }
                #invoice-print .no-print { display: none !important; }
              }
            `}</style>
          </div>
        </div>

        )}
    </div>

  </PageShell>
)
  }
function getBaseProductName(name: string = '') {
  return name
    .replace(/\s*[-–—]\s*(METAL|NON|RED|GREEN|BLUE|WHITE|BLACK|CHROME|GREY|GRAY|TEA|FRANCE).*$/i, '')
    .replace(/\s+(METAL|NON|RED|GREEN|BLUE|WHITE|BLACK|CHROME|GREY|GRAY|TEA|FRANCE)$/i, '')
    .replace(/\.{2,}$/g, '')
    .trim()
}


