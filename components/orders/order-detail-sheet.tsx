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
          !w-[calc(100vw-16px)]
          !max-w-none
          sm:!w-[420px]
          sm:!max-w-[420px]
          p-0
          overflow-hidden
        "
      >


        {/* =========================================
            HEADER
        ========================================= */}

        <SheetHeader
          className="
            border-b
            border-border
            px-4
            py-3
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
                  text-lg
                  leading-tight
                  sm:text-2xl
                "
              >
                THÔNG TIN ĐƠN HÀNG
              </SheetTitle>

              <SheetDescription>
                Tạo lúc{' '}
                {formatDateTime(
                  order.created_at
                )}
              </SheetDescription>

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
              min-w-0
              flex-1
              overflow-x-hidden
              overflow-y-auto
              p-2.5
              text-sm
              custom-scroll
              sm:p-3
            "
          >


            {/* =====================================
                PAYMENT SUMMARY
            ===================================== */}

            <h2
              className="
                mb-2
                text-sm
                font-semibold
              "
            >
              Thông tin đơn hàng
            </h2>


            <div
              className="
                mb-3
                rounded-xl
                border
                border-slate-800
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
                    font-semibold
                    text-green-500
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
                    font-semibold
                    text-red-500
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
                rounded-xl
                border
                border-slate-800
                p-2.5
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
                Lịch sử thanh toán
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
                p-2.5
              "
            >

              <div
                className="
                  mb-2
                  text-xs
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                Thông tin khách hàng
              </div>


              <div
                className="
                  min-w-0
                  space-y-2
                  break-words
                  text-sm
                "
              >

                <div>

                  <span
                    className="
                      text-slate-400
                    "
                  >
                    Khách hàng:
                  </span>

                  {' '}

                  <span
                    className="
                      font-medium
                    "
                  >
                    {order.customers?.full_name}
                  </span>

                </div>


                <div>

                  <span
                    className="
                      text-slate-400
                    "
                  >
                    SĐT:
                  </span>

                  {' '}

                  {order.customers?.phone}

                </div>


                <div>

                  <span
                    className="
                      text-slate-400
                    "
                  >
                    Địa chỉ:
                  </span>

                  {' '}

                  {order.customers?.address}

                </div>


                <div>

                  <span
                    className="
                      text-slate-400
                    "
                  >
                    Mã đơn:
                  </span>

                  {' '}

                  {order.order_code}

                </div>


                <div>

                  <span
                    className="
                      text-slate-400
                    "
                  >
                    Mã KH:
                  </span>

                  {' '}

                  {order.customers?.customer_display_code}

                </div>

              </div>

            </div>


            {/* =====================================
                ORDER ITEMS
            ===================================== */}

            <div
              className="
                mt-4
              "
            >

              {(order.order_items || []).map(
                (item: any) => (

                  <div
                    key={item.id}
                    className="
                      flex
                      min-w-0
                      items-start
                      gap-3
                      justify-between
                      border-b
                      py-2
                    "
                  >

                    <div className="min-w-0 flex-1">

                      <div
                        className="
                          break-words
                          font-medium
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
                        shrink-0
                        whitespace-nowrap
                        text-right
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


            {/* =====================================
                TOTAL
            ===================================== */}

            <div
              className="
                mt-3
                text-right
              "
            >

              <div
                className="
                  text-base
                  font-bold
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
              border-border
              bg-slate-950
              p-3
            "
          >

            <div
              className="
                grid
                gap-3
              "
            >


              {/* PRINT */}

              <Button
                variant="outline"
                onClick={() =>
                  setShowPrintSettings(true)
                }
                className="
                  w-full
                "
              >

                <Printer
                  className="
                    mr-2
                    h-4
                    w-4
                  "
                />

                In hóa đơn

              </Button>


              {/* PAYMENT */}

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
                    h-10
                    flex-1
                    rounded-md
                    border
                    border-slate-700
                    bg-slate-900
                    px-3
                    text-sm
                    text-white
                  "
                />


                <Button
                  onClick={
                    handleCollectPayment
                  }
                  className="
                    min-w-[90px]
                  "
                >
                  Thu tiền
                </Button>

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