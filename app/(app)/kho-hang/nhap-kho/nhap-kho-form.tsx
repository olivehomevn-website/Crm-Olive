'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  History,
  Loader2,
  PackagePlus,
  Search,
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Product = {
  id: string
  name: string
  sku?: string | null
  category?: string | null
  color?: string | null
  stock_quantity?: number | null
  cost_price?: number | null
  sale_price?: number | null
  image_url?: string | null
}

type InventoryHistory = {
  id: string
  quantity: number
  created_at: string
  note?: string | null
}

export default function NhapKhoForm({
  products,
}: {
  products: Product[]
}) {
  const searchParams = useSearchParams()

  const [showAll, setShowAll] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<InventoryHistory[]>([])
  const [search, setSearch] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [costPrice, setCostPrice] = useState('0')
  const [salePrice, setSalePrice] = useState('0')
  const [uploadingImage, setUploadingImage] = useState(false)

  /*
   * =========================================================
   * QUICK IMPORT FROM CREATE ORDER
   * /kho-hang/nhap-kho?productId=xxx&sku=xxx
   * =========================================================
   */
  useEffect(() => {
    if (!products.length) return

    const productId = searchParams.get('productId')
    const sku = searchParams.get('sku')

    const quickProduct =
      (productId
        ? products.find((p) => p.id === productId)
        : undefined) ||
      (sku
        ? products.find((p) => p.sku === sku)
        : undefined)

    if (quickProduct) {
      setSelectedId(quickProduct.id)
      setSelectedName(quickProduct.name)
      return
    }

    if (!selectedName) {
      setSelectedName(products[0]?.name || '')
    }
  }, [products, searchParams, selectedName])

  const variants = useMemo(
    () =>
      products.filter(
        (product) => product.name === selectedName,
      ),
    [products, selectedName],
  )

  /*
   * Khi đổi tên sản phẩm, chọn variant đầu tiên.
   * Nếu URL truyền productId thì effect quick-import phía trên
   * đã chọn đúng sản phẩm; không cần ép lại khi cùng tên.
   */
  useEffect(() => {
    if (!selectedName || !variants.length) return

    const currentStillBelongsToName = variants.some(
      (variant) => variant.id === selectedId,
    )

    if (!currentStillBelongsToName) {
      setSelectedId(variants[0].id)
    }
  }, [selectedName, variants, selectedId])

  const selectedProduct =
    products.find((product) => product.id === selectedId) ||
    variants[0] ||
    null

  useEffect(() => {
    if (!selectedProduct) return

    setCostPrice(
      String(Number(selectedProduct.cost_price || 0)),
    )

    setSalePrice(
      String(Number(selectedProduct.sale_price || 0)),
    )

    setImageUrl(selectedProduct.image_url || '')
  }, [selectedProduct?.id])

  useEffect(() => {
    if (!selectedProduct?.id) {
      setHistory([])
      return
    }

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('id, quantity, created_at, note')
        .eq('product_id', selectedProduct.id)
        .eq('transaction_type', 'IMPORT')
        .order('created_at', {
          ascending: false,
        })
        .limit(5)

      if (error) {
        console.error('LOAD IMPORT HISTORY ERROR', error)
        setHistory([])
        return
      }

      setHistory(data || [])
    }

    loadHistory()
  }, [selectedProduct?.id])

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const uniqueProducts = Array.from(
      new Map(
        products.map((product) => [
          product.name,
          product,
        ]),
      ).values(),
    )

    if (!keyword) return uniqueProducts

    return uniqueProducts.filter((product) => {
      const name = product.name?.toLowerCase() || ''
      const sku = product.sku?.toLowerCase() || ''

      return (
        name.includes(keyword) ||
        sku.includes(keyword)
      )
    })
  }, [products, search])

  const visibleProducts = showAll
    ? filteredProducts
    : filteredProducts.slice(0, 8)

  const estimatedTotal =
    Number(quantity || 0) * Number(costPrice || 0)

  const stock = Number(
    selectedProduct?.stock_quantity || 0,
  )

  const stockLabel =
    stock <= 0
      ? 'Hết hàng'
      : stock <= 5
        ? 'Sắp hết'
        : 'Còn hàng'

  const stockClass =
    stock <= 0
      ? 'bg-red-500/15 text-red-400 border-red-500/20'
      : stock <= 5
        ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
        : 'bg-green-500/15 text-green-400 border-green-500/20'

  const handleSelectProduct = (product: Product) => {
    setSelectedName(product.name)
    setSelectedId(product.id)

    window.setTimeout(() => {
      document
        .getElementById('nhap-kho-form')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 50)
  }

  const handleUploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !selectedProduct) return

    try {
      setUploadingImage(true)

      const ext =
        file.name.split('.').pop()?.toLowerCase() ||
        'jpg'

      const fileName =
        `${selectedProduct.id}-${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          upsert: true,
        })

      if (error) {
        alert(error.message)
        return
      }

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(fileName)

      const publicUrl = data.publicUrl

      const { error: updateError } =
        await supabase
          .from('products')
          .update({
            image_url: publicUrl,
          })
          .eq('id', selectedProduct.id)

      if (updateError) {
        alert(updateError.message)
        return
      }

      setImageUrl(publicUrl)
    } catch (error) {
      console.error(error)
      alert('Không thể cập nhật ảnh sản phẩm')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleImport = async () => {
    if (!selectedProduct) {
      alert('Vui lòng chọn sản phẩm')
      return
    }

    const qty = Number(quantity)

    if (!Number.isFinite(qty) || qty <= 0) {
      alert('Vui lòng nhập số lượng lớn hơn 0')
      return
    }

    if (!Number.isFinite(Number(costPrice)) || Number(costPrice) < 0) {
      alert('Giá nhập không hợp lệ')
      return
    }

    if (
      !Number.isFinite(Number(salePrice)) ||
      Number(salePrice) < 0
    ) {
      alert('Giá bán không hợp lệ')
      return
    }

    try {
      setLoading(true)

      const newStock =
        Number(selectedProduct.stock_quantity || 0) + qty

      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_quantity: newStock,
          cost_price: Number(costPrice),
          sale_price: Number(salePrice),
          image_url:
            imageUrl || selectedProduct.image_url || null,
        })
        .eq('id', selectedProduct.id)

      if (updateError) {
        alert(updateError.message)
        return
      }

      const { error: logError } = await supabase
        .from('inventory_transactions')
        .insert({
          product_id: selectedProduct.id,
          sku: selectedProduct.sku,
          transaction_type: 'IMPORT',
          quantity: qty,
          stock_after: newStock,
          reference_type: 'PURCHASE',
          reference_id: `PN${Date.now()}`,
          created_by: 'ADMIN',
          note: note.trim(),
        })

      if (logError) {
        alert(logError.message)
        return
      }

      alert(
        `Nhập kho thành công\nTồn mới: ${newStock} sản phẩm`,
      )

      setQuantity('')
      setNote('')

      /*
       * Quay về URL sạch để lần mở sau không tự chọn
       * sản phẩm cũ từ query parameter.
       */
      window.location.assign('/kho-hang/nhap-kho')
    } catch (error) {
      console.error('IMPORT ERROR', error)
      alert('Có lỗi xảy ra khi nhập kho')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="box-border w-[calc(100%+32px)] min-w-0 -mx-4 overflow-x-hidden px-4 pb-8 pt-2 sm:mx-0 sm:w-full sm:px-6 sm:pt-6">
      {/* =====================================================
          GLOBAL APP HEADER
          Sidebar + Search + Notifications + Avatar
          Dùng chung cho toàn bộ ERP.
      ====================================================== */}
      <div className="-mx-4 sm:mx-0">
        <AppHeader title="" />
      </div>

      {/* PAGE TITLE + DESCRIPTION
          Đặt bên dưới AppHeader để mobile có thứ tự:
          Header → Nhập kho → mô tả → nội dung
      */}
      <div className="mb-4 pt-4 sm:mb-6 sm:pt-5">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Nhập kho
        </h1>
        <p className="mt-2 text-xs text-slate-400 sm:text-sm">
          Chọn sản phẩm và cập nhật số lượng nhập kho
        </p>
      </div>

      {/* =====================================================
          PRODUCT SELECTOR
      ====================================================== */}
      <section className="box-border w-full min-w-0 rounded-2xl border border-slate-800 bg-slate-950 p-2.5 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
          

           
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:items-center">
            <Link
              href="/san-pham/them-moi"
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-1.5
                rounded-xl
                bg-cyan-500
                px-3
                text-xs
                font-bold
                text-slate-950
                transition
                active:scale-[0.98]
                hover:bg-cyan-400
                sm:px-4
                sm:text-sm
              "
            >
              <PackagePlus className="h-4 w-4" />
              Tạo sản phẩm
            </Link>

            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-1.5
                rounded-xl
                border
                border-slate-700
                bg-slate-900
                px-3
                text-xs
                font-semibold
                text-slate-200
                transition
                active:scale-[0.98]
                hover:border-cyan-500
                sm:px-4
                sm:text-sm
              "
            >
              {showAll ? 'Thu gọn' : 'Hiển thị tất cả'}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAll ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            type="search"
            placeholder="Tìm tên sản phẩm hoặc SKU..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="
              min-h-12
              w-full
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              px-10
              text-base
              text-white
              outline-none
              placeholder:text-slate-500
              focus:border-cyan-500
              focus:ring-2
              focus:ring-cyan-500/10
            "
          />
        </div>

        {/* PRODUCT GRID */}
        <div className="mt-3 grid w-full min-w-0 grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {visibleProducts.map((product, index) => {
            const isSelected =
              selectedProduct?.id === product.id

            const productStock = Number(
              product.stock_quantity || 0,
            )

            return (
              <button
                key={product.id}
                type="button"
                onClick={() =>
                  handleSelectProduct(product)
                }
                className={`
                  ${index >= 4 ? 'max-sm:hidden' : ''}
                  min-w-0
                  rounded-xl
                  border
                  p-2
                  text-left
                  transition
                  active:scale-[0.98]
                  group
                  sm:p-3
                  ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(6,182,212,0.15)]'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                  }
                `}
              >
                <div className="min-w-0">
                  <div className="aspect-square w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                    <img
                      src={
                        product.image_url ||
                        '/placeholder.jpg'
                      }
                      alt={product.name}
                      className="
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-200
                        group-hover:scale-[1.02]
                      "
                    />
                  </div>

                  <div className="mt-2 min-w-0">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-white sm:text-sm">
                      {product.name}
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-slate-500 sm:text-[11px]">
                      {product.sku || 'Chưa có SKU'}
                    </p>

                    <span
                      className={`
                        mt-1.5
                        inline-flex
                        rounded-full
                        border
                        px-1.5
                        py-0.5
                        text-[8px]
                        font-semibold
                        sm:text-[10px]
                        ${
                          productStock <= 0
                            ? 'border-red-500/20 bg-red-500/10 text-red-400'
                            : productStock <= 5
                              ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                              : 'border-green-500/20 bg-green-500/10 text-green-400'
                        }
                      `}
                    >
                      Tồn {productStock}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {visibleProducts.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            Không tìm thấy sản phẩm
          </div>
        )}

        {!showAll &&
          filteredProducts.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 hidden min-h-10 w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-cyan-400 transition hover:border-cyan-500 sm:flex"
            >
              Xem thêm {filteredProducts.length - 8} sản phẩm
            </button>
          )}
      </section>

      {/* =====================================================
          SELECTED PRODUCT + IMPORT FORM
      ====================================================== */}
      {selectedProduct && (
        <div
          id="nhap-kho-form"
          className="mt-4 scroll-mt-4 sm:mt-6"
        >
          <div className="grid min-w-0 gap-4 lg:grid-cols-5 lg:gap-5">
            {/* PRODUCT DETAIL */}
            <section className="min-w-0 w-full rounded-2xl border border-slate-800 bg-slate-900 p-2.5 sm:p-5 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="aspect-square w-24 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 sm:w-32">
                  <img
                    src={
                      imageUrl ||
                      selectedProduct.image_url ||
                      '/placeholder.jpg'
                    }
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-3 text-sm font-bold leading-5 text-white sm:text-lg sm:leading-6">
                    {selectedProduct.name}
                  </h2>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold sm:text-xs ${stockClass}`}
                  >
                    {stockLabel} · {stock} sản phẩm
                  </span>
                </div>
              </div>

              {/* UPLOAD */}
              <label
                className="
                  mt-3
                  flex
                  min-h-11
                  cursor-pointer
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-3
                  text-xs
                  font-semibold
                  text-slate-200
                  transition
                  hover:border-cyan-500
                  hover:text-cyan-400
                  sm:text-sm
                "
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải ảnh...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Đổi ảnh sản phẩm
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={handleUploadImage}
                />
              </label>

              {/* VARIANTS */}
              {variants.length > 1 && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400 sm:text-sm">
                    Chọn màu / phiên bản
                  </label>

                  <select
                    value={selectedId}
                    onChange={(event) =>
                      setSelectedId(event.target.value)
                    }
                    className="
                      min-h-11
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-950
                      px-3
                      text-sm
                      text-white
                      outline-none
                      focus:border-cyan-500
                    "
                  >
                    {variants.map((variant) => (
                      <option
                        key={variant.id}
                        value={variant.id}
                      >
                        {variant.color ||
                          variant.sku ||
                          'Phiên bản'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* INFO */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                <InfoItem
                  label="SKU"
                  value={selectedProduct.sku || '—'}
                />

                <InfoItem
                  label="Tồn kho"
                  value={`${stock} SP`}
                  valueClass={
                    stock <= 0
                      ? 'text-red-400'
                      : stock <= 5
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }
                />

                <InfoItem
                  label="Danh mục"
                  value={
                    selectedProduct.category || '—'
                  }
                />

                <InfoItem
                  label="Màu sắc"
                  value={
                    selectedProduct.color || '—'
                  }
                />

                <InfoItem
                  label="Giá nhập cũ"
                  value={`${Number(
                    selectedProduct.cost_price || 0,
                  ).toLocaleString('vi-VN')} đ`}
                />

                <InfoItem
                  label="Giá bán hiện tại"
                  value={`${Number(
                    selectedProduct.sale_price || 0,
                  ).toLocaleString('vi-VN')} đ`}
                  valueClass="text-cyan-400"
                />
              </div>
            </section>

            {/* IMPORT FORM */}
            <section className="min-w-0 w-full rounded-2xl border border-slate-800 bg-slate-900 p-2.5 sm:p-5 lg:col-span-3">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <PackagePlus className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    Nhập hàng
                  </h3>

                  <p className="text-[10px] text-slate-500 sm:text-xs">
                    Cập nhật tồn kho và giá sản phẩm
                  </p>
                </div>
              </div>

              {/* PRICE */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Field
                  label="Giá nhập mới"
                  value={costPrice}
                  onChange={setCostPrice}
                  suffix="đ"
                />

                <Field
                  label="Giá bán mới"
                  value={salePrice}
                  onChange={setSalePrice}
                  suffix="đ"
                />
              </div>

              {/* QUANTITY */}
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold text-slate-300 sm:text-sm">
                  Số lượng nhập
                </label>

                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  placeholder="Nhập số lượng..."
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  className="
                    min-h-14
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    px-4
                    text-xl
                    font-bold
                    text-white
                    outline-none
                    placeholder:text-sm
                    placeholder:font-normal
                    placeholder:text-slate-600
                    focus:border-cyan-500
                    focus:ring-2
                    focus:ring-cyan-500/10
                    sm:text-2xl
                  "
                />
              </div>

              {/* ESTIMATE */}
              <div className="mt-3 rounded-xl border border-cyan-500/10 bg-cyan-500/10 px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 sm:text-xs">
                    Tạm tính
                  </span>

                  <span className="text-base font-bold text-cyan-400 sm:text-lg">
                    {estimatedTotal.toLocaleString(
                      'vi-VN',
                    )}{' '}
                    đ
                  </span>
                </div>
              </div>

              {/* NOTE */}
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold text-slate-300 sm:text-sm">
                  Ghi chú nhập hàng
                </label>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  rows={3}
                  placeholder="Ví dụ: Nhập lô mới, hàng nhà cung cấp..."
                  className="
                    min-h-20
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-950
                    px-3
                    py-2.5
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-cyan-500
                  "
                />
              </div>

              {/* HISTORY */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-400" />

                  <h4 className="text-xs font-bold text-slate-200 sm:text-sm">
                    Lịch sử nhập gần nhất
                  </h4>
                </div>

                {history.length === 0 ? (
                  <p className="py-2 text-center text-[11px] text-slate-600">
                    Chưa có lịch sử nhập
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-[11px]"
                      >
                        <span className="font-semibold text-slate-200">
                          +{item.quantity} SP
                        </span>

                        <span className="shrink-0 text-slate-500">
                          {new Date(
                            item.created_at,
                          ).toLocaleDateString(
                            'vi-VN',
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACTION */}
              <button
                type="button"
                onClick={handleImport}
                disabled={
                  loading ||
                  uploadingImage ||
                  !quantity
                }
                className="
                  mt-4
                  flex
                  min-h-14
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-cyan-500
                  px-4
                  text-base
                  font-bold
                  text-slate-950
                  transition
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  hover:bg-cyan-400
                  sm:text-lg
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang nhập kho...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Nhập kho
                  </>
                )}
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2.5 sm:px-3">
      <p className="text-[9px] text-slate-500 sm:text-[10px]">
        {label}
      </p>

      <p
        className={`mt-0.5 truncate text-[11px] font-semibold sm:text-xs ${valueClass}`}
      >
        {value}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-slate-300 sm:text-sm">
        {label}
      </label>

      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="
            min-h-12
            w-full
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            px-3
            pr-8
            text-sm
            font-semibold
            text-white
            outline-none
            focus:border-cyan-500
            focus:ring-2
            focus:ring-cyan-500/10
            sm:text-base
          "
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
