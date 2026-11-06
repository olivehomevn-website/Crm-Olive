'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import {
  Search, Download, Package, PackageCheck, PackageX, AlertTriangle,
  MoreHorizontal, Eye, Pencil, Copy, ArrowDownToLine, ArrowUpFromLine,
  EyeOff, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react'

export default function ProductsTable({
  products,
}: {
  products: any[]
}) {

const [productList, setProductList] =
  useState(products)

useEffect(() => {
  setProductList(products)
}, [products])

const [search, setSearch] =
  useState('')

  const [quickFilter, setQuickFilter] =
  useState('ALL')

  const [sortBy, setSortBy] =
  useState('NEWEST')

const [currentPage, setCurrentPage] =
  useState(1)

const ITEMS_PER_PAGE = 10

const handleExportExcel = () => {

  const exportData =
    productList.map((item) => ({

      SKU: item.sku,

      'Tên sản phẩm':
        item.name,

      'Danh mục':
        item.category,

      'Màu sắc':
        item.color || '',

      'Giá vốn':
        item.cost_price,

      'Giá bán':
        item.sale_price,

      'Tồn kho':
        item.stock_quantity,

      'Trạng thái':
        item.status,

      'Ngày tạo':
        item.created_at,
    }))

  const worksheet =
    XLSX.utils.json_to_sheet(
      exportData
    )

  const workbook =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Products'
  )

  XLSX.writeFile(
    workbook,
    `products-${new Date()
      .toISOString()
      .slice(0,10)}.xlsx`
  )
}

const [showDeleteModal, setShowDeleteModal] =
  useState(false)

const [selectedProduct, setSelectedProduct] =
  useState<any>(null)

const [viewModal, setViewModal] =
  useState(false)

const [importModal, setImportModal] =
  useState(false)

const [exportModal, setExportModal] =
  useState(false)

const [exportQty, setExportQty] =
  useState('')

const [exportNote, setExportNote] =
  useState('')

const [exportLoading, setExportLoading] =
  useState(false)

const [importQty, setImportQty] =
  useState('')

const [importNote, setImportNote] =
  useState('')

const [importLoading, setImportLoading] =
  useState(false)

const [openMenu, setOpenMenu] =
  useState<string | null>(null)

const filteredProducts =
  productList
    .filter((p) => {

      const matchSearch =
        p.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        p.sku
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )

      let matchFilter = true

      if (quickFilter === 'ACTIVE') {
        matchFilter =
          p.status === 'active'
      }

      if (quickFilter === 'INACTIVE') {
        matchFilter =
          p.status === 'inactive'
      }

      if (quickFilter === 'LOW_STOCK') {
        matchFilter =
          Number(p.stock_quantity) > 0 &&
          Number(p.stock_quantity) <= 5
      }

      if (quickFilter === 'OUT_OF_STOCK') {
        matchFilter =
          Number(p.stock_quantity) === 0
      }

      return (
        matchSearch &&
        matchFilter
      )
    })
    .sort((a, b) => {

      switch (sortBy) {

        case 'NAME':
          return a.name.localeCompare(
            b.name
          )

        case 'PRICE_ASC':
          return (
            a.sale_price -
            b.sale_price
          )

        case 'PRICE_DESC':
          return (
            b.sale_price -
            a.sale_price
          )

        case 'STOCK_ASC':
          return (
            a.stock_quantity -
            b.stock_quantity
          )

        case 'STOCK_DESC':
          return (
            b.stock_quantity -
            a.stock_quantity
          )

        default:
          return (
            new Date(
              b.created_at
            ).getTime() -
            new Date(
              a.created_at
            ).getTime()
          )

      }

    })

  const startIndex =
  (currentPage - 1) * ITEMS_PER_PAGE

const paginatedProducts =
  filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

const totalPages =
  Math.ceil(
    filteredProducts.length /
    ITEMS_PER_PAGE
  )



  const renderProductActions = (item: any) => (
    <div className="relative flex justify-end">
      <button type="button" aria-label={`Thao tác ${item.name}`}
        onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300">
        <MoreHorizontal size={18} />
      </button>
      {openMenu === item.id && (
        <div className="absolute right-0 top-10 z-[100] w-52 overflow-hidden rounded-xl border border-slate-700 bg-[#111c2a] p-1.5 shadow-2xl shadow-black/40">
          <button type="button" onClick={() => { setSelectedProduct(item); setViewModal(true); setOpenMenu(null) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800">
            <Eye size={15} className="text-cyan-400" /> Xem nhanh
          </button>
          <Link href={`/san-pham/${item.id}`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-200 transition hover:bg-slate-800">
            <Pencil size={15} className="text-amber-400" /> Sửa sản phẩm
          </Link>
          <button type="button" onClick={async () => {
            const { error } = await supabase.from('products').insert({
              sku: `${item.sku}-COPY`, name: `${item.name} COPY`,
              category: item.category, cost_price: item.cost_price,
              sale_price: item.sale_price, stock_quantity: 0,
              image_url: item.image_url, status: 'active',
              size: item.size, color: item.color, sku_master: item.sku_master,
            })
            if (error) { alert(error.message); return }
            window.location.reload()
          }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800">
            <Copy size={15} className="text-violet-400" /> Nhân bản sản phẩm
          </button>
          <div className="my-1 border-t border-slate-800" />
          <button type="button" onClick={() => { setSelectedProduct(item); setImportModal(true); setOpenMenu(null) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800">
            <ArrowDownToLine size={15} className="text-emerald-400" /> Nhập kho
          </button>
          <button type="button" onClick={() => { setSelectedProduct(item); setExportModal(true); setOpenMenu(null) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800">
            <ArrowUpFromLine size={15} className="text-orange-400" /> Xuất kho
          </button>
          <div className="my-1 border-t border-slate-800" />
          <button type="button" onClick={() => { setSelectedProduct(item); setShowDeleteModal(true); setOpenMenu(null) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-amber-300 transition hover:bg-amber-500/10">
            <EyeOff size={15} /> {item.status === 'inactive' ? 'Khôi phục sản phẩm' : 'Ẩn sản phẩm'}
          </button>
          <button type="button" onClick={async () => {
            if (!confirm(`Xóa vĩnh viễn ${item.name}?`)) return
            const { error } = await supabase.from('products').delete().eq('id', item.id)
            if (error) { alert(error.message); return }
            alert('Đã xóa sản phẩm')
            window.location.reload()
          }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-500/10">
            <Trash2 size={15} /> Xóa vĩnh viễn
          </button>
        </div>
      )}
    </div>
  )

  const stockBadge = (quantity: number | string) => {
    const stock = Number(quantity) || 0
    if (stock <= 0) return { label: 'Hết hàng', icon: PackageX, className: 'border-rose-500/25 bg-rose-500/10 text-rose-300' }
    if (stock <= 5) return { label: 'Sắp hết', icon: AlertTriangle, className: 'border-amber-500/25 bg-amber-500/10 text-amber-300' }
    return { label: 'Còn hàng', icon: PackageCheck, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' }
  }

  return (
    <>
      <section className="w-full min-w-0">
        <div className="border-b border-slate-800/90 p-3 sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                placeholder="Tìm theo tên sản phẩm hoặc SKU..."
                className="h-10 w-full rounded-xl border border-slate-700/80 bg-[#0a1320] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10 sm:h-11"
              />
            </div>
            <div className="relative w-full sm:w-[190px] sm:shrink-0">
              <SlidersHorizontal size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1) }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-700/80 bg-[#0a1320] pl-9 pr-3 text-sm text-slate-200 outline-none transition hover:border-cyan-500/50 focus:border-cyan-500 sm:h-11"
              >
                <option value="NEWEST">Mới nhất</option>
                <option value="NAME">Tên A-Z</option>
                <option value="PRICE_ASC">Giá tăng dần</option>
                <option value="PRICE_DESC">Giá giảm dần</option>
                <option value="STOCK_ASC">Tồn kho tăng dần</option>
                <option value="STOCK_DESC">Tồn kho giảm dần</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {[
                { value: 'ALL', label: 'Tất cả', active: 'border-cyan-400/30 bg-cyan-500 text-slate-950' },
                { value: 'ACTIVE', label: 'Đang bán', active: 'border-emerald-400/30 bg-emerald-500 text-slate-950' },
                { value: 'INACTIVE', label: 'Đã ẩn', active: 'border-rose-400/30 bg-rose-500 text-white' },
                { value: 'LOW_STOCK', label: 'Sắp hết', active: 'border-amber-400/30 bg-amber-400 text-slate-950' },
                { value: 'OUT_OF_STOCK', label: 'Hết hàng', active: 'border-rose-500/30 bg-rose-600 text-white' },
              ].map((filter) => (
                <button key={filter.value} type="button" onClick={() => { setQuickFilter(filter.value); setCurrentPage(1) }}
                  className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-[11px] font-semibold transition sm:h-9 sm:px-3.5 sm:text-xs ${
                    quickFilter === filter.value ? filter.active : 'border-slate-700/70 bg-slate-800/70 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}>
                  {filter.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleExportExcel}
              className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 sm:w-auto sm:text-sm">
              <Download size={15} /> Xuất Excel
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 sm:text-sm">
            <Package size={15} className="text-cyan-400" />
            <span>
              Hiển thị <strong className="font-semibold text-white">{filteredProducts.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)}</strong>
              {' '}trong <strong className="font-semibold text-white">{filteredProducts.length}</strong> sản phẩm
            </span>
          </div>
          <span className="hidden text-[11px] text-slate-500 sm:inline">{ITEMS_PER_PAGE} sản phẩm / trang</span>
        </div>

        {/* Mobile product cards */}
        <div className="grid grid-cols-1 gap-2.5 px-3 pb-3 md:hidden">
          {paginatedProducts.map((item) => {
            const stock = stockBadge(item.stock_quantity)
            const StockIcon = stock.icon
            return (
              <article key={item.id} className="rounded-xl border border-slate-800 bg-[#0a1320] p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-800">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name || 'Sản phẩm'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><ImageIcon size={20} className="text-slate-600" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-all text-[10px] font-semibold tracking-wide text-cyan-400">{item.sku || 'Chưa có SKU'}</p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-100">{item.name}</h3>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="whitespace-nowrap text-sm font-bold tabular-nums text-white">{Number(item.sale_price || 0).toLocaleString('vi-VN')} đ</p>
                        <p className="mt-1 text-[10px] text-slate-500">Giá bán</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="max-w-full truncate rounded-md border border-slate-700/70 bg-slate-800/70 px-2 py-1 text-[10px] text-slate-400">{item.category || 'Chưa phân loại'}</span>
                      {item.color && <span className="max-w-[100px] truncate rounded-md border border-slate-700/70 bg-slate-800/70 px-2 py-1 text-[10px] text-slate-400">{item.color}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${stock.className}`}>
                    <StockIcon size={14} /><span>{stock.label}</span><span className="ml-0.5 tabular-nums">{Number(item.stock_quantity) || 0}</span>
                  </span>
                  {renderProductActions(item)}
                </div>
              </article>
            )
          })}
          {paginatedProducts.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 px-4 py-10 text-center">
              <Package size={28} className="mx-auto text-slate-600" />
              <p className="mt-2 text-sm font-medium text-slate-300">Không tìm thấy sản phẩm</p>
              <p className="mt-1 text-xs text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto border-t border-slate-800/80 md:block">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead className="bg-[#111c2a]">
              <tr>
                {[
                  ['Ảnh', 'w-[76px]'],
                  ['SKU', 'w-[170px]'],
                  ['Tên sản phẩm', 'min-w-[230px]'],
                  ['Danh mục', 'min-w-[150px]'],
                  ['Màu', 'w-[110px]'],
                  ['Giá bán', 'w-[150px]'],
                  ['Tồn kho', 'w-[140px]'],
                  ['Thao tác', 'w-[90px]'],
                ].map(([label, width]) => (
                  <th key={label} className={`${width} whitespace-nowrap px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((item) => {
                const stock = stockBadge(item.stock_quantity)
                const StockIcon = stock.icon
                return (
                  <tr key={item.id} className="border-t border-slate-800/80 transition hover:bg-slate-800/25">
                    <td className="px-4 py-3">
                      <div className="h-11 w-11 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-800">
                        {item.image_url ? <img src={item.image_url} alt={item.name || 'Sản phẩm'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon size={17} className="text-slate-600" /></div>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-cyan-300">{item.sku}</span></td>
                    <td className="px-4 py-3"><p className="max-w-[320px] truncate text-sm font-semibold text-slate-100">{item.name}</p></td>
                    <td className="px-4 py-3"><span className="inline-flex max-w-[160px] truncate rounded-lg border border-slate-700/70 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-300">{item.category || '-'}</span></td>
                    <td className="px-4 py-3"><span className="inline-flex max-w-[100px] truncate rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">{item.color || '-'}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-bold tabular-nums text-white">{Number(item.sale_price || 0).toLocaleString('vi-VN')} đ</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold tabular-nums ${stock.className}`}>
                        <StockIcon size={14} />{Number(item.stock_quantity) || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">{renderProductActions(item)}</td>
                  </tr>
                )
              })}
              {paginatedProducts.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <Package size={30} className="mx-auto text-slate-600" />
                  <p className="mt-2 text-sm font-medium text-slate-300">Không tìm thấy sản phẩm</p>
                  <p className="mt-1 text-xs text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-800/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-center text-[11px] text-slate-500 sm:text-left sm:text-xs">Trang {totalPages === 0 ? 0 : currentPage} / {totalPages}</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-slate-300 transition hover:border-cyan-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Trang trước">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, index, visiblePages) => (
                <span key={page} className="contents">
                  {index > 0 && page - visiblePages[index - 1] > 1 && <span className="px-1 text-xs text-slate-600">…</span>}
                  <button type="button" onClick={() => setCurrentPage(page)} className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-semibold tabular-nums transition ${currentPage === page ? 'border-cyan-400 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/15' : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
                    {page}
                  </button>
                </span>
              ))}
            <button type="button" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-slate-300 transition hover:border-cyan-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Trang sau">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm">

    <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900/60
backdrop-blur-sm/60
backdrop-blur-sm/60
backdrop-blur-sm/60
backdrop-blur-sm/60
backdrop-blur-sm/60
backdrop-blur-sm p-6">

      <div className="text-center">

        <div className="mb-3 text-5xl">
          ⚠️
        </div>

        <h2 className="text-xl font-bold">
  {selectedProduct?.status === 'inactive'
    ? 'Khôi phục sản phẩm'
    : 'Ẩn sản phẩm'}
</h2>

        <p className="mt-3 text-slate-400">
  {selectedProduct?.status === 'inactive'
    ? 'Khôi phục sản phẩm:'
    : 'Ẩn sản phẩm:'}
</p>

        <p className="mt-2 font-semibold text-red-400">
          {selectedProduct?.name}
        </p>

      </div>

      <div className="mt-6 flex gap-3">

        <button
          onClick={() => {
            setShowDeleteModal(false)
            setSelectedProduct(null)
          }}
          className="flex-1 rounded-xl border border-slate-700 py-2"
        >
          Hủy
        </button>

        <button
          onClick={async () => {
            
            const { data, error } =
 await supabase
  .from('products')
  .update({
  status:
    selectedProduct.status === 'inactive'
      ? 'active'
      : 'inactive',
})
  .eq('id', selectedProduct.id)
  .select()

            
if (error) {
  alert(error.message)
  return
}

alert(
  selectedProduct.status === 'inactive'
    ? 'Đã khôi phục sản phẩm'
    : 'Đã ẩn sản phẩm'
)

            setProductList(
  productList.filter(
    (p) => p.id !== selectedProduct.id
  )
)

setShowDeleteModal(false)
setSelectedProduct(null)
          }}
          className="flex-1 rounded-xl bg-red-500 py-2 font-semibold text-white"
        >
          {selectedProduct?.status === 'inactive'
  ? 'Khôi phục'
  : 'Ẩn sản phẩm'}
        </button>

      </div>

    </div>

  </div>
)}

{importModal && selectedProduct && (

<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3">

  <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-900 p-4 sm:p-6">

    <h2 className="mb-6 text-2xl font-bold">
      Nhập kho nhanh
    </h2>

    <div className="space-y-4">

      <div>

        <label>Tên sản phẩm</label>

        <div>

  <label>Màu sắc</label>

  <input
    disabled
    value={selectedProduct.color || '-'}
    className="mt-2 w-full rounded-lg bg-slate-800 p-3"
  />

</div>

<div>

  <label>Giá vốn</label>

  <input
    disabled
    value={
      Number(
        selectedProduct.cost_price || 0
      ).toLocaleString('vi-VN') + ' đ'
    }
    className="mt-2 w-full rounded-lg bg-slate-800 p-3"
  />

</div>

        <input
          disabled
          value={selectedProduct.name}
          className="mt-2 w-full rounded-lg bg-slate-800 p-3"
        />

      </div>

      <div>

        <label>Tồn hiện tại</label>

        <input
          disabled
          value={selectedProduct.stock_quantity}
          className="mt-2 w-full rounded-lg bg-slate-800 p-3"
        />

      </div>

      <div>

        <label>Số lượng nhập</label>

        <input
          type="number"
          value={importQty}
          onChange={(e) =>
            setImportQty(e.target.value)
          }
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
        />

      </div>

      <div>

        <label>Ghi chú</label>

        <textarea
          value={importNote}
          onChange={(e) =>
            setImportNote(e.target.value)
          }
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
        />

      </div>

    </div>

    <div className="mt-6 flex gap-3">

      <button
        onClick={() => {
          setImportModal(false)
          setImportQty('')
          setImportNote('')
        }}
        className="flex-1 rounded-xl border border-slate-700 py-3"
      >
        Hủy
      </button>

      <button
        disabled={importLoading}
        onClick={async () => {

          if (!importQty) {
            alert('Vui lòng nhập số lượng')
            return
          }

          try {

            setImportLoading(true)

            const qty =
              Number(importQty)

            const newStock =
              selectedProduct.stock_quantity +
              qty

            const { error: updateError } =
              await supabase
                .from('products')
                .update({
                  stock_quantity:
                    newStock,
                })
                .eq(
                  'id',
                  selectedProduct.id
                )

            if (updateError) {
              alert(updateError.message)
              return
            }

            const { error: logError } =
              await supabase
                .from(
                  'inventory_transactions'
                )
                .insert({

                  product_id:
                    selectedProduct.id,

                  sku:
                    selectedProduct.sku,

                  transaction_type:
                    'IMPORT',

                  quantity: qty,

                  stock_after:
                    newStock,

                  reference_type:
                    'PURCHASE',

                  reference_id:
                    `PN${Date.now()}`,

                  created_by:
                    'ADMIN',

                  note:
                    importNote,
                })

            if (logError) {
              alert(logError.message)
              return
            }

            window.location.reload()

          } catch (err) {

            console.error(err)
            alert('Có lỗi xảy ra')

          } finally {

            setImportLoading(false)

          }

        }}
        className="flex-1 rounded-xl bg-green-500 py-3 font-semibold text-black"
      >
        {importLoading
          ? 'Đang nhập...'
          : 'Nhập kho'}
      </button>

    </div>

  </div>

</div>

)}

{exportModal && selectedProduct && (

<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3">

  <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-900 p-4 sm:p-6">

    <h2 className="mb-6 text-2xl font-bold">
      Xuất kho nhanh
    </h2>

    <div className="space-y-4">

      <div>
        <label>Tên sản phẩm</label>
        <input
          disabled
          value={selectedProduct.name}
          className="mt-2 w-full rounded-lg bg-slate-800 p-3"
        />
      </div>

      <div>
        <label>Màu sắc</label>
        <input
          disabled
          value={selectedProduct.color || '-'}
          className="mt-2 w-full rounded-lg bg-slate-800 p-3"
        />
      </div>

      <div>
        <label>Giá vốn</label>
        <input
          disabled
          value={
            Number(
              selectedProduct.cost_price || 0
            ).toLocaleString('vi-VN') + ' đ'
          }
          className="mt-2 w-full rounded-lg bg-slate-800 p-3"
        />
      </div>

      <div>
        <label>Tồn hiện tại</label>
        <input
          disabled
          value={selectedProduct.stock_quantity}
          className="mt-2 w-full rounded-lg bg-slate-800 p-3"
        />
      </div>

      <div>
        <label>Số lượng xuất</label>
        <input
          type="number"
          value={exportQty}
          onChange={(e) =>
            setExportQty(e.target.value)
          }
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
        />
      </div>

      <div>
        <label>Ghi chú</label>
        <textarea
          value={exportNote}
          onChange={(e) =>
            setExportNote(e.target.value)
          }
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
        />
      </div>

    </div>

    <div className="mt-6 flex gap-3">

      <button
        onClick={() => {
          setExportModal(false)
          setExportQty('')
          setExportNote('')
        }}
        className="flex-1 rounded-xl border border-slate-700 py-3"
      >
        Hủy
      </button>

      <button
        disabled={exportLoading}
        onClick={async () => {

          const qty =
            Number(exportQty)

          if (
            qty <= 0 ||
            qty >
              selectedProduct.stock_quantity
          ) {
            alert(
              'Số lượng xuất không hợp lệ'
            )
            return
          }

          try {

            setExportLoading(true)

            const newStock =
              selectedProduct.stock_quantity -
              qty

            const { error: updateError } =
              await supabase
                .from('products')
                .update({
                  stock_quantity:
                    newStock,
                })
                .eq(
                  'id',
                  selectedProduct.id
                )

            if (updateError) {
              alert(updateError.message)
              return
            }

            const { error: logError } =
              await supabase
                .from(
                  'inventory_transactions'
                )
                .insert({

                  product_id:
                    selectedProduct.id,

                  sku:
                    selectedProduct.sku,

                  transaction_type:
                    'EXPORT',

                  quantity: qty,

                  stock_after:
                    newStock,

                  reference_type:
                    'SALE',

                  reference_id:
                    `PX${Date.now()}`,

                  created_by:
                    'ADMIN',

                  note:
                    exportNote,
                })

            if (logError) {
              alert(logError.message)
              return
            }

            window.location.reload()

          } catch (err) {

            console.error(err)
            alert('Có lỗi xảy ra')

          } finally {

            setExportLoading(false)

          }

        }}
        className="flex-1 rounded-xl bg-orange-500 py-3 font-semibold text-black"
      >
        {exportLoading
          ? 'Đang xuất...'
          : 'Xuất kho'}
      </button>

    </div>

  </div>

</div>

)}



{viewModal && selectedProduct && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3">

    <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-900/60
backdrop-blur-sm/60
backdrop-blur-sm/60
backdrop-blur-sm/60
backdrop-blur-sm/60
backdrop-blur-sm p-6">

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-2xl font-bold">
          Chi tiết sản phẩm
        </h2>

        <button
          onClick={() =>
            setViewModal(false)
          }
          className="text-slate-400"
        >
          ✕
        </button>

      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">

        <div>

          <img
            src={
              selectedProduct.image_url
            }
            alt={
              selectedProduct.name
            }
            className="
              h-56
              w-full
              sm:h-80
              rounded-xl
              object-cover
            "
          />

        </div>

        <div className="space-y-3">

          <div>
            <p className="text-slate-400">
              Tên sản phẩm
            </p>

            <p className="font-semibold">
              {selectedProduct.name}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              SKU
            </p>

            <p>
              {selectedProduct.sku}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Danh mục
            </p>

            <p>
              {selectedProduct.category}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Màu sắc
            </p>

            <p>
              {selectedProduct.color}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Giá vốn
            </p>

            <p>
              {Number(
                selectedProduct.cost_price
              ).toLocaleString('vi-VN')} đ
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Giá bán
            </p>

            <p className="text-green-400 font-bold">
              {Number(
                selectedProduct.sale_price
              ).toLocaleString('vi-VN')} đ
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Tồn kho
            </p>

            <p>
              {selectedProduct.stock_quantity}
            </p>
          </div>

        </div>

      </div>

    </div>

  </div>
)}

    </>
  )
}