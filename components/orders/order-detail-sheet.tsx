'use client'

import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { Button } from '@/components/ui/button'

import {
  Printer,
  CalendarDays,
  CheckCircle2,
  WalletCards,
  History,
  UserRound,
  Phone,
  MapPin,
  FileText,
  Package,
  StickyNote,
  Save,
  CircleDollarSign,
} from 'lucide-react'

import {
  type Order,
} from '@/lib/data'

import {
  formatDateTime,
} from '@/lib/format'

import InvoicePrint from './invoice-print'


export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {

  const [paymentAmount, setPaymentAmount] =
    useState('')

  const [
    paymentHistory,
    setPaymentHistory,
  ] = useState<any[]>([])

  /*
   * ==============================
   * STOCK DEBT / ETA
   * ==============================
   */

  const [
    expectedStockDate,
    setExpectedStockDate,
  ] = useState('')

  const [
    stockNote,
    setStockNote,
  ] = useState('')

  const [
    customerNotified,
    setCustomerNotified,
  ] = useState(false)

  const [
    savingStockInfo,
    setSavingStockInfo,
  ] = useState(false)

  const [
    stockSaved,
    setStockSaved,
  ] = useState(false)

  /*
   * ==============================
   * PRINT SETTINGS
   * ==============================
   */

  const [
    printSize,
    setPrintSize,
  ] = useState<'A4' | 'A5'>('A5')

  const [
    showPrintSettings,
    setShowPrintSettings,
  ] = useState(false)


  /*
   * ==============================
   * PAYMENT HISTORY
   * ==============================
   */

  useEffect(() => {

    if (!order?.id) {
      setPaymentHistory([])
      return
    }

    loadPaymentHistory()

  }, [order?.id])


  useEffect(() => {

    if (!order?.id) {
      setExpectedStockDate('')
      setStockNote('')
      setCustomerNotified(false)
      setStockSaved(false)
      return
    }

    setExpectedStockDate(
      order.expected_stock_date
        ? String(order.expected_stock_date).slice(0, 10)
        : ''
    )

    setStockNote(
      order.stock_note || ''
    )

    setCustomerNotified(
      Boolean(order.last_contact_at)
    )

    setStockSaved(false)

  }, [
    order?.id,
    order?.expected_stock_date,
    order?.stock_note,
    order?.last_contact_at,
  ])


  const loadPaymentHistory =
    async () => {

      if (!order?.id) return

      const { data } =
        await supabase
          .from(
            'payment_transactions'
          )
          .select('*')
          .eq(
            'order_id',
            order.id
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          )

      setPaymentHistory(
        data || []
      )
    }


  /*
   * ==============================
   * SAVE STOCK / ETA
   * ==============================
   */

  const handleSaveStockInfo =
    async () => {

      if (!order?.id) return

      setSavingStockInfo(true)
      setStockSaved(false)

      const { error } =
        await supabase
          .from('orders')
          .update({
            expected_stock_date:
              expectedStockDate || null,
            stock_note:
              stockNote.trim() || null,
            last_contact_at:
              customerNotified
                ? (
                    order.last_contact_at ||
                    new Date().toISOString()
                  )
                : null,
          })
          .eq(
            'id',
            order.id
          )

      setSavingStockInfo(false)

      if (error) {
        console.error(
          'Không thể lưu thông tin nợ hàng:',
          error
        )
        return
      }

      setStockSaved(true)

      setTimeout(() => {
        setStockSaved(false)
      }, 2000)
    }


  /*
   * ==============================
   * COLLECT PAYMENT
   * ==============================
   */

  const handleCollectPayment =
    async () => {

      if (!order) return

      const amount =
        Number(paymentAmount)

      if (
        !amount ||
        amount <= 0
      ) {
        return
      }

      const paid =
        Number(
          order.paid_amount || 0
        ) + amount

      const remaining =
        Math.max(
          0,
          Number(
            order.total_amount || 0
          ) - paid
        )


      await supabase
        .from('orders')
        .update({
          paid_amount: paid,
          remaining_amount: remaining,
          payment_status:
            remaining === 0
              ? 'paid'
              : 'partial',
        })
        .eq(
          'id',
          order.id
        )


      await supabase
        .from(
          'payment_transactions'
        )
        .insert({
          order_id: order.id,
          amount: amount,
          payment_method: 'cash',
          note:
            `Thu tiền đơn ${order.order_code}`,
        })


      window.location.reload()
    }


  /*
   * ==============================
   * PRINT
   * ==============================
   */

  const handlePrint = (
    paperSize: 'A4' | 'A5'
  ) => {

    const printContents =
      document.getElementById(
        'invoice-print'
      )?.outerHTML

    if (!printContents) {
      return
    }


    const printWindow =
      window.open(
        '',
        '_blank'
      )

    if (!printWindow) {
      return
    }


    /*
     * PAGE SIZE
     */

    const pageWidth =
      paperSize === 'A4'
        ? '210mm'
        : '148mm'

    const pageHeight =
      paperSize === 'A4'
        ? '297mm'
        : '210mm'


    /*
     * INVOICE CONTENT WIDTH
     *
     * A4:
     * 210mm
     *
     * A5:
     * 148mm
     */

    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
  Olive Living - ${order?.order_code || 'Invoice'}
</title>


<style>

/* =========================================
   PAGE
========================================= */

@page {

  size: ${paperSize} portrait;

  margin: 0;

}


/* =========================================
   HTML / BODY
========================================= */

html,
body {

  width: ${pageWidth};

  min-width: ${pageWidth};

  max-width: ${pageWidth};

  min-height: ${pageHeight};

  margin: 0;

  padding: 0;

  background: #ffffff;

}


/* =========================================
   BODY
========================================= */

body {

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color: #111111;

  box-sizing: border-box;

}


/* =========================================
   ALL ELEMENTS
========================================= */

*,
*::before,
*::after {

  box-sizing: border-box;

}


/* =========================================
   INVOICE
========================================= */

#invoice-print {

  display: flex !important;

  flex-direction: column !important;

  width: ${pageWidth} !important;

  min-width: ${pageWidth} !important;

  max-width: ${pageWidth} !important;

  min-height: ${pageHeight} !important;

  margin: 0 !important;

  padding: ${
    paperSize === 'A4'
      ? '12mm'
      : '9mm'
  } !important;

  box-sizing: border-box !important;

  background: #ffffff !important;

}


/* =========================================
   TABLE
========================================= */

table {

  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;

}


thead {

  display: table-header-group;

}


tr {

  page-break-inside: avoid;

  break-inside: avoid;

}


td,
th {

  box-sizing: border-box;

}


/* =========================================
   PRINT
========================================= */

@media print {

  html,
  body {

    width: ${pageWidth};

    min-width: ${pageWidth};

    max-width: ${pageWidth};

    min-height: ${pageHeight};

    margin: 0;

    padding: 0;

  }


  #invoice-print {

    width: ${pageWidth} !important;

    min-width: ${pageWidth} !important;

    max-width: ${pageWidth} !important;

    min-height: ${pageHeight} !important;

    margin: 0 !important;

    box-shadow: none !important;

  }

}

</style>

</head>


<body>


${printContents}


<script>

window.onload = function () {

  setTimeout(function () {

    window.print()

  }, 500)

}

</script>


</body>

</html>

`)


    printWindow.document.close()
  }


  /*
   * ==============================
   * SAFETY
   * ==============================
   */

  if (!order) {
    return null
  }


  /*
   * ==============================
   * VALUES
   * ==============================
   */

  const paidAmount =
    Number(
      order.paid_amount || 0
    )

  const totalAmount =
    Number(
      order.total_amount || 0
    )

  const remainingAmount =
    Math.max(
      totalAmount -
      paidAmount,
      0
    )


  /*
   * ==============================
   * UI
   * ==============================
   */

  return (

    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >

      <SheetContent
        className="
          !w-full
          sm:!w-[440px]
          sm:!max-w-[440px]
          p-0
          overflow-hidden
          border-l
          border-slate-800
          bg-[#07111d]
          shadow-2xl
        "
      >


        {/* =========================================
            HEADER
        ========================================= */}

        <SheetHeader
          className="
            border-b
            border-slate-800
            bg-[#08131f]
            px-4
            py-4
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-2
            "
          >

            <div>

              <SheetTitle
                className="
                  text-blue-500
                  text-2xl
                "
              >
                THÔNG TIN ĐƠN HÀNG
              </SheetTitle>

              <div
                className="
                  mt-1
                  flex
                  items-center
                  gap-2
                "
              >
                <FileText className="size-3.5 text-slate-500" />
                <SheetDescription className="text-xs text-slate-500">
                  Tạo lúc{' '}
                  {formatDateTime(
                    order.created_at
                  )}
                </SheetDescription>
              </div>

            </div>

          </div>

        </SheetHeader>


        {/* =========================================
            CONTENT
        ========================================= */}

        <div
          className="
            flex
            h-[calc(100vh-90px)]
            flex-col
          "
        >

          <div
            className="
              flex-1
              overflow-y-auto
              bg-[#07111d]
              p-3
              text-sm
              custom-scroll
            "
          >


            {/* =====================================
                PAYMENT SUMMARY
            ===================================== */}

            <div
              className="
                mb-2
                flex
                items-center
                gap-2
              "
            >
              <div
                className="
                  flex
                  size-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-cyan-500/10
                  text-cyan-400
                "
              >
                <WalletCards className="size-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Thông tin đơn hàng
                </h2>
                <p className="text-[11px] text-slate-500">
                  Tổng quan thanh toán
                </p>
              </div>
            </div>


            <div
              className="
                mb-3
                rounded-xl
                border
                border-slate-800
                bg-[#0b1724]
                p-3
              "
            >

              <div
                className="
                  mb-2
                  flex
                  justify-between
                "
              >

                <span
                  className="
                    text-slate-400
                  "
                >
                  Đã thu
                </span>

                <span
                  className="
                    text-lg
                    font-bold
                    tracking-tight
                    text-emerald-400
                  "
                >
                  {paidAmount.toLocaleString(
                    'vi-VN'
                  )}
                  đ
                </span>

              </div>


              <div
                className="
                  flex
                  justify-between
                "
              >

                <span
                  className="
                    text-slate-400
                  "
                >
                  Còn nợ
                </span>

                <span
                  className="
                    text-lg
                    font-bold
                    tracking-tight
                    text-rose-400
                  "
                >
                  {remainingAmount.toLocaleString(
                    'vi-VN'
                  )}
                  đ
                </span>

              </div>

            </div>


            {/* =====================================
                PAYMENT HISTORY
            ===================================== */}

            <div
              className="
                mt-3
                rounded-xl
                border
                border-slate-800
                bg-[#0b1724]
                p-3
              "
            >

              <div
                className="
                  mb-3
                  text-xs
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                <span className="flex items-center gap-2">
                  <History className="size-3.5" />
                  Lịch sử thanh toán
                </span>
              </div>


              {paymentHistory.length === 0 && (

                <div
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Chưa có giao dịch
                </div>

              )}


              {paymentHistory.map(
                (p) => (

                  <div
                    key={p.id}
                    className="
                      flex
                      justify-between
                      border-b
                      border-slate-800
                      py-2
                    "
                  >

                    <div>

                      <div
                        className="
                          text-sm
                          font-medium
                          text-green-400
                        "
                      >
                        +
                        {Number(
                          p.amount || 0
                        ).toLocaleString(
                          'vi-VN'
                        )}
                        đ
                      </div>

                      <div
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        {formatDateTime(
                          p.created_at
                        )}
                      </div>

                    </div>

                  </div>

                )
              )}

            </div>


            {/* =====================================
                CUSTOMER
            ===================================== */}

            <div
              className="
                mt-3
                rounded-xl
                border
                border-slate-800
                bg-[#0b1724]
                p-3
              "
            >

              <div
                className="
                  mb-3
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                <div
                  className="
                    flex
                    size-7
                    items-center
                    justify-center
                    rounded-lg
                    bg-violet-500/10
                    text-violet-400
                  "
                >
                  <UserRound className="size-4" />
                </div>

                Thông tin khách hàng
              </div>


              <div
                className="
                  space-y-2
                  text-sm
                "
              >

                <div className="flex items-start gap-2">
                  <UserRound className="mt-0.5 size-3.5 shrink-0 text-slate-600" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500">Khách hàng</div>
                    <div className="font-medium text-slate-100">
                      {order.customers?.full_name}
                    </div>
                  </div>
                </div>


                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-3.5 shrink-0 text-slate-600" />
                  <div>
                    <div className="text-[11px] text-slate-500">SĐT</div>
                    <div className="text-slate-200">
                      {order.customers?.phone}
                    </div>
                  </div>
                </div>


                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-600" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500">Địa chỉ</div>
                    <div className="leading-5 text-slate-200">
                      {order.customers?.address}
                    </div>
                  </div>
                </div>


                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-slate-600" />
                  <div>
                    <div className="text-[11px] text-slate-500">Mã đơn</div>
                    <div className="font-mono text-xs text-slate-200">
                      {order.order_code}
                    </div>
                  </div>
                </div>


                <div className="flex items-start gap-2">
                  <CircleDollarSign className="mt-0.5 size-3.5 shrink-0 text-slate-600" />
                  <div>
                    <div className="text-[11px] text-slate-500">Mã KH</div>
                    <div className="font-mono text-xs text-slate-200">
                      {order.customers?.customer_display_code}
                    </div>
                  </div>
                </div>

              </div>

            </div>


            {/* =====================================
                STOCK DEBT / ETA
            ===================================== */}

            <div
              className="
                mt-3
                rounded-xl
                border
                border-orange-500/15
                bg-gradient-to-b
                from-orange-500/[0.06]
                to-[#0b1724]
                p-3
              "
            >

              <div
                className="
                  mb-3
                  flex
                  items-center
                  gap-2
                "
              >

                <div
                  className="
                    flex
                    size-7
                    items-center
                    justify-center
                    rounded-lg
                    bg-orange-500/10
                    text-orange-300
                  "
                >
                  <CalendarDays className="size-4" />
                </div>

                <div>

                  <div
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Tình trạng hàng
                  </div>

                  <div
                    className="
                      text-xs
                      text-slate-600
                    "
                  >
                    Theo dõi hàng đang thiếu
                  </div>

                </div>

              </div>


              {/* ETA */}

              <div>

                <label
                  className="
                    mb-1.5
                    block
                    text-xs
                    text-slate-400
                  "
                >
                  Dự kiến hàng về
                </label>

                <div className="relative">

                  <input
                    type="date"
                    value={expectedStockDate}
                    onChange={(e) =>
                      setExpectedStockDate(
                        e.target.value
                      )
                    }
                    className="
                      h-10
                      w-full
                      rounded-lg
                      border
                      border-slate-700
                      bg-slate-900
                      px-3
                      text-sm
                      text-white
                      outline-none
                      transition
                      focus:border-orange-400
                    "
                  />

                </div>

                {expectedStockDate && (

                  <div
                    className="
                      mt-1.5
                      text-xs
                      text-orange-300
                    "
                  >
                    {(() => {

                      const today =
                        new Date()

                      today.setHours(
                        0, 0, 0, 0
                      )

                      const eta =
                        new Date(
                          `${expectedStockDate}T00:00:00`
                        )

                      const diff =
                        Math.ceil(
                          (
                            eta.getTime() -
                            today.getTime()
                          ) /
                          86400000
                        )

                      if (diff > 1) {
                        return `Còn ${diff} ngày`
                      }

                      if (diff === 1) {
                        return 'Còn 1 ngày'
                      }

                      if (diff === 0) {
                        return 'Hàng dự kiến về hôm nay'
                      }

                      return `Trễ ${Math.abs(diff)} ngày`
                    })()}
                  </div>

                )}

              </div>


              {/* CUSTOMER NOTIFIED */}

              <button
                type="button"
                onClick={() =>
                  setCustomerNotified(
                    !customerNotified
                  )
                }
                className="
                  mt-3
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-lg
                  border
                  border-slate-800
                  bg-slate-900/60
                  px-3
                  py-2.5
                  text-left
                  transition
                  hover:border-slate-700
                "
              >

                <div>

                  <div
                    className="
                      text-xs
                      text-slate-400
                    "
                  >
                    Khách đã được thông báo
                  </div>

                  <div
                    className={`
                      mt-0.5
                      text-sm
                      font-medium
                      ${
                        customerNotified
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }
                    `}
                  >
                    {customerNotified
                      ? 'Đã thông báo'
                      : 'Chưa thông báo'}
                  </div>

                </div>

                <CheckCircle2
                  className={`
                    size-5
                    ${
                      customerNotified
                        ? 'text-emerald-400'
                        : 'text-slate-700'
                    }
                  `}
                />

              </button>


              {/* NOTE */}

              <div className="mt-3">

                <label
                  className="
                    mb-1.5
                    block
                    text-xs
                    text-slate-400
                  "
                >
                  Ghi chú
                </label>

                <textarea
                  value={stockNote}
                  onChange={(e) =>
                    setStockNote(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Ví dụ: Hàng đang chờ nhà cung cấp, khách đồng ý chờ..."
                  className="
                    w-full
                    resize-none
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-900
                    px-3
                    py-2.5
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-orange-400
                  "
                />

              </div>


              {/* SAVE */}

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-between
                  gap-2
                "
              >

                <span
                  className="
                    text-xs
                    text-slate-600
                  "
                >
                  {stockSaved
                    ? 'Đã lưu cập nhật'
                    : 'Cập nhật khi có thông tin mới'}
                </span>

                <Button
                  type="button"
                  onClick={
                    handleSaveStockInfo
                  }
                  disabled={
                    savingStockInfo
                  }
                  className="
                    h-9
                    bg-orange-500
                    px-4
                    text-xs
                    text-white
                    hover:bg-orange-600
                  "
                >
                  {savingStockInfo ? (
                    'Đang lưu...'
                  ) : (
                    <>
                      <Save className="mr-1.5 size-3.5" />
                      Lưu cập nhật
                    </>
                  )}
                </Button>

              </div>

            </div>


            {/* =====================================
                ORDER ITEMS
            ===================================== */}

            <div className="mt-4">

              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  px-1
                "
              >
                <Package className="size-4 text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sản phẩm
                </span>
                <span className="text-[11px] text-slate-600">
                  {(order.order_items || []).length} sản phẩm
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0b1724]">

                {(order.order_items || []).map(
                (item: any) => (

                  <div
                    key={item.id}
                    className="
                      flex
                      justify-between
                      gap-3
                      border-b
                      border-slate-800
                      px-3
                      py-3
                      last:border-b-0
                    "
                  >

                    <div>

                      <div
                        className="
                          font-medium
                          leading-5
                          text-slate-100
                        "
                      >
                        {item.product_name ||
                          'Sản phẩm'}
                      </div>


                      <div
                        className="
                          text-xs
                          text-muted-foreground
                        "
                      >
                        SL: {item.quantity}
                      </div>


                      {item.sku && (

                        <div
                          className="
                            text-xs
                            text-slate-400
                          "
                        >
                          SKU: {item.sku}
                        </div>

                      )}


                      {item.color && (

                        <div
                          className="
                            text-xs
                            text-slate-400
                          "
                        >
                          Màu: {item.color}
                        </div>

                      )}

                    </div>


                    <div
                      className="
                        whitespace-nowrap
                      "
                    >
                      {Number(
                        item.subtotal || 0
                      ).toLocaleString(
                        'vi-VN'
                      )}
                      đ
                    </div>

                  </div>

                )
              )}

              </div>

            </div>


            {/* =====================================
                TOTAL
            ===================================== */}

            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-slate-800
                bg-[#0b1724]
                px-3
                py-3
              "
            >
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Tổng đơn
              </span>

              <div
                className="
                  text-lg
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                {totalAmount.toLocaleString(
                  'vi-VN'
                )}
                đ
              </div>

            </div>


          </div>


          {/* =======================================
              FOOTER ACTIONS
          ======================================= */}

          <div
            className="
              mt-auto
              border-t
              border-slate-800
              bg-[#06101b]/98
              p-3
              shadow-[0_-18px_40px_rgba(2,6,23,0.48)]
            "
          >

            <div className="grid gap-2.5">

              {/* PRINT */}

              <Button
                variant="outline"
                onClick={() =>
                  setShowPrintSettings(true)
                }
                className="
                  h-10
                  w-full
                  rounded-xl
                  border-slate-700
                  bg-slate-900/80
                  text-sm
                  font-medium
                  text-slate-200
                  transition-all
                  hover:border-slate-600
                  hover:bg-slate-800
                "
              >

                <Printer
                  className="
                    mr-2
                    size-4
                  "
                />

                In hóa đơn

              </Button>


              {/* PAYMENT */}

              <div
                className="
                  rounded-2xl
                  border
                  border-cyan-400/25
                  bg-gradient-to-b
                  from-cyan-500/[0.08]
                  to-cyan-500/[0.02]
                  p-3
                  shadow-[0_8px_30px_rgba(6,182,212,0.08)]
                "
              >

                <div
                  className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    px-1
                  "
                >

                  <span
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >
                    Thu tiền
                  </span>

                  <span
                    className="
                      text-[11px]
                      text-cyan-400
                    "
                  >
                    <CircleDollarSign className="size-3.5" />
                    Nhập số tiền
                  </span>

                </div>


                <div
                  className="
                    flex
                    gap-2
                  "
                >

                  <input
                    type="number"
                    placeholder="Nhập số tiền thu"
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(
                        e.target.value
                      )
                    }
                    className="
                      h-12
                      min-w-0
                      flex-1
                      rounded-xl
                      border
                      border-cyan-500/25
                      bg-slate-950
                      px-3.5
                      text-base
                      font-semibold
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-500
                      focus:border-cyan-400
                      focus:ring-2
                      focus:ring-cyan-400/10
                    "
                  />


                  <Button
                    onClick={
                      handleCollectPayment
                    }
                    className="
                      h-12
                      min-w-[112px]
                      rounded-xl
                      bg-cyan-500
                      px-5
                      text-sm
                      font-semibold
                      text-white
                      shadow-[0_8px_24px_rgba(6,182,212,0.22)]
                      transition-all
                      hover:-translate-y-0.5
                      hover:bg-cyan-400
                      hover:shadow-[0_10px_28px_rgba(6,182,212,0.30)]
                      active:translate-y-0
                    "
                  >
                    Thu tiền
                  </Button>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =========================================
            PRINT SETTINGS MODAL
        ========================================= */}

        {showPrintSettings && (

          <div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-black/60
              p-4
            "
          >

            <div
              className="
                w-full
                max-w-[380px]
                rounded-2xl
                bg-white
                p-5
                shadow-2xl
              "
            >

              {/* TITLE */}

              <div
                className="
                  mb-5
                "
              >

                <h3
                  className="
                    text-lg
                    font-semibold
                    text-black
                  "
                >
                  Cấu hình in hóa đơn
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  Chọn khổ giấy trước khi in
                </p>

              </div>


              {/* PAPER SIZE */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >


                {/* ================= A5 ================= */}

                <button
                  type="button"
                  onClick={() =>
                    setPrintSize('A5')
                  }
                  className={`
                    rounded-xl
                    border
                    p-4
                    text-left
                    transition
                    ${
                      printSize === 'A5'
                        ? `
                          border-black
                          bg-gray-100
                        `
                        : `
                          border-gray-200
                          hover:border-gray-400
                        `
                    }
                  `}
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <span
                      className="
                        text-base
                        font-bold
                        text-black
                      "
                    >
                      A5
                    </span>


                    {printSize === 'A5' && (

                      <span
                        className="
                          text-sm
                          font-bold
                          text-black
                        "
                      >
                        ✓
                      </span>

                    )}

                  </div>


                  <div
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    148 × 210 mm
                  </div>


                  <div
                    className="
                      mt-4
                      flex
                      justify-center
                    "
                  >

                    <div
                      className="
                        h-[78px]
                        w-[55px]
                        border
                        border-gray-400
                        bg-white
                        shadow-sm
                      "
                    />

                  </div>

                </button>


                {/* ================= A4 ================= */}

                <button
                  type="button"
                  onClick={() =>
                    setPrintSize('A4')
                  }
                  className={`
                    rounded-xl
                    border
                    p-4
                    text-left
                    transition
                    ${
                      printSize === 'A4'
                        ? `
                          border-black
                          bg-gray-100
                        `
                        : `
                          border-gray-200
                          hover:border-gray-400
                        `
                    }
                  `}
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <span
                      className="
                        text-base
                        font-bold
                        text-black
                      "
                    >
                      A4
                    </span>


                    {printSize === 'A4' && (

                      <span
                        className="
                          text-sm
                          font-bold
                          text-black
                        "
                      >
                        ✓
                      </span>

                    )}

                  </div>


                  <div
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    210 × 297 mm
                  </div>


                  <div
                    className="
                      mt-4
                      flex
                      justify-center
                    "
                  >

                    <div
                      className="
                        h-[100px]
                        w-[70px]
                        border
                        border-gray-400
                        bg-white
                        shadow-sm
                      "
                    />

                  </div>

                </button>

              </div>


              {/* ACTIONS */}

              <div
                className="
                  mt-5
                  flex
                  gap-2
                "
              >

                <Button
                  variant="outline"
                  className="
                    flex-1
                  "
                  onClick={() =>
                    setShowPrintSettings(false)
                  }
                >
                  Hủy
                </Button>


                <Button
                  className="
                    flex-1
                  "
                  onClick={() => {

                    setShowPrintSettings(
                      false
                    )

                    /*
                     * Đợi modal đóng rồi mới
                     * lấy invoice để in.
                     */

                    setTimeout(() => {

                      handlePrint(
                        printSize
                      )

                    }, 150)

                  }}
                >

                  <Printer
                    className="
                      mr-2
                      h-4
                      w-4
                    "
                  />

                  In {printSize}

                </Button>

              </div>

            </div>

          </div>

        )}


        {/* =========================================
            HIDDEN INVOICE
        ========================================= */}

        <div
          style={{
            position: 'absolute',
            left: '-99999px',
            top: 0,
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >

          <InvoicePrint
            order={order}
            paperSize={printSize}
          />

        </div>


      </SheetContent>

    </Sheet>

  )
}