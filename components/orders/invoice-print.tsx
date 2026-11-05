'use client'

type InvoicePaperSize = 'A4' | 'A5'

export default function InvoicePrint({
  order,
  paperSize = 'A5',
  language = 'vi',
}: {
  order: any
  paperSize?: InvoicePaperSize
  language?: 'vi' | 'en'
}) {
  const isA5 = paperSize === 'A5'
  const isEnglish = language === 'en'
  const mainFont = 'Arial, Helvetica, sans-serif'
  const pixelFont = '"Pixel Operator", "Pixeloid Sans", "Silkscreen", "Press Start 2P", "Courier New", monospace'

  const moneyArial = (v: any) => (
    <span style={{ fontFamily: mainFont, fontWeight: 700 }}>
      {Number(v || 0).toLocaleString('vi-VN')} đ
    </span>
  )

  const money = (v: any) => (
    <span style={{ fontFamily: pixelFont, fontWeight: 700 }}>
      {Number(v || 0).toLocaleString('vi-VN')} đ
    </span>
  )
  const date = (v: any) => {
    if (!v) return '-'
    try { return new Date(v).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN') } catch { return '-' }
  }
  const address = (value: any): string => {
    if (!value) return ''

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value).trim()
    }

    if (Array.isArray(value)) {
      return value.map((item) => address(item)).filter(Boolean).join(', ')
    }

    if (typeof value === 'object') {
      // Nếu dữ liệu đã có địa chỉ đầy đủ thì ưu tiên dùng nguyên chuỗi đó.
      const full =
        value.formatted_address ||
        value.formattedAddress ||
        value.full_address ||
        value.fullAddress ||
        value.complete_address ||
        value.completeAddress

      if (typeof full === 'string' && full.trim()) return full.trim()

      const fields = [
        value.address,
        value.address_detail,
        value.addressDetail,
        value.detail,
        value.specific_address,
        value.specificAddress,
        value.address_line,
        value.addressLine,
        value.address_line_1,
        value.addressLine1,
        value.address_line_2,
        value.addressLine2,
        value.street_address,
        value.streetAddress,
        value.street,
        value.house_number,
        value.houseNumber,
        value.ward,
        value.ward_name,
        value.wardName,
        value.ward_code,
        value.district,
        value.district_name,
        value.districtName,
        value.province,
        value.province_name,
        value.provinceName,
        value.city,
        value.city_name,
        value.cityName,
      ]

      const result = fields
        .map((part) => address(part))
        .filter(Boolean)

      return [...new Set(result)].join(', ')
    }

    return ''
  }

  const customer = order?.customer || order?.customers || {}
  const customerName = order?.customer_name || order?.customerName || customer?.full_name || customer?.fullName || customer?.name || 'Khách lẻ'
  const customerTitle = order?.customer_title || order?.customerTitle || customer?.customer_title || customer?.customerTitle || ''
  const customerCode = order?.customer_code || order?.customerCode || customer?.customer_display_code || customer?.customer_code || customer?.customerCode || '-'
  const customerPhone = order?.customer_phone || order?.customerPhone || order?.phone || customer?.phone || '-'
  const customerEmail = order?.customer_email || order?.customerEmail || order?.email || customer?.email || ''
  const customerSource = order?.customer_source || order?.customerSource || customer?.customer_source || customer?.customerSource || '-'
  const customerNote = order?.customer_note || order?.customerNote || customer?.customer_note || customer?.customerNote || order?.note || ''
  const shippingProvider = order?.shipping_provider || order?.shippingProvider || order?.carrier || order?.shipping_carrier || '-'
  const rawShippingMethod =
    order?.shipping_method ||
    order?.shippingMethod ||
    order?.delivery_method ||
    order?.deliveryMethod ||
    order?.shipping_type ||
    order?.shippingType ||
    '-'

  const shippingMethod = (() => {
    const value = String(rawShippingMethod || '').trim()
    const normalized = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

    if (!value || value === '-') return '-'

    if (
      normalized === 'express' ||
      normalized === 'fast' ||
      normalized === 'urgent' ||
      normalized === 'same day' ||
      normalized.includes('hỏa tốc') ||
      normalized.includes('hoa toc')
    ) {
      return 'Hỏa tốc'
    }

    if (
      normalized === 'standard' ||
      normalized === 'normal' ||
      normalized === 'regular' ||
      normalized.includes('tiêu chuẩn') ||
      normalized.includes('tieu chuan')
    ) {
      return 'Tiêu chuẩn'
    }

    if (
      normalized === 'economy' ||
      normalized === 'saving' ||
      normalized === ' tiết kiệm' ||
      normalized.includes('tiết kiệm') ||
      normalized.includes('tiet kiem')
    ) {
      return 'Tiết kiệm'
    }

    return value
  })()
  // ĐỊA CHỈ KHÁCH HÀNG: lấy từ thông tin giao hàng của đơn hoặc hồ sơ khách.
  const customerAddress =
    address(order?.shipping_address) ||
    address(order?.shippingAddress) ||
    address(order?.delivery_address) ||
    address(order?.deliveryAddress) ||
    address(order?.recipient_address) ||
    address(order?.recipientAddress) ||
    address(order?.customer_address) ||
    address(order?.customerAddress) ||
    address(order?.address) ||
    address(customer?.shipping_address) ||
    address(customer?.shippingAddress) ||
    address(customer?.delivery_address) ||
    address(customer?.deliveryAddress) ||
    address(customer?.address) ||
    address(customer?.full_address) ||
    address(customer?.fullAddress) ||
    '-'

  const displayedShippingMethod = isEnglish
    ? shippingMethod === 'Hỏa tốc'
      ? 'Express'
      : shippingMethod === 'Tiêu chuẩn'
        ? 'Standard'
        : shippingMethod === 'Tiết kiệm'
          ? 'Economy'
          : shippingMethod
    : shippingMethod

  const orderCode = order?.order_code || order?.orderCode || order?.code || order?.order_number || order?.orderNumber || order?.id || '-'
  const orderDate = order?.order_date || order?.orderDate || order?.created_at || order?.createdAt
  const paymentMethod = order?.payment_method || order?.paymentMethod || 'COD'
  const displayedPaymentMethod = isEnglish
    ? String(paymentMethod).toLowerCase() === 'cod'
      ? 'Cash on delivery'
      : String(paymentMethod).toLowerCase() === 'bank_transfer'
        ? 'Bank transfer'
        : String(paymentMethod).toLowerCase() === 'cash'
          ? 'Cash'
          : paymentMethod
    : paymentMethod
  const paidAmount = Number(order?.paid_amount || order?.paidAmount || 0)
  const totalAmount = Number(order?.total_amount || order?.totalAmount || order?.grand_total || order?.grandTotal || order?.total || 0)
  const remaining = Math.max(totalAmount - paidAmount, 0)
  const discount = Number(order?.discount_amount || order?.discountAmount || order?.discount || 0)
  const shippingFee = Number(order?.shipping_fee || order?.shippingFee || order?.delivery_fee || 0)
  const subtotal = Number(order?.subtotal || order?.sub_total || order?.subtotal_amount || Math.max(totalAmount - shippingFee + discount, 0))
  const items = order?.items || order?.order_items || order?.orderItems || order?.products || []

  const s = isA5 ? {
    pad: '6mm',
    brand: '21px', title: '25px', small: '8px', tiny: '7.8px',
    body: '9px', body2: '9px', table: '8.8px', sku: '7.8px',
    policy: '8px', policyTitle: '9px', total: '9px', grand: '12px',
    footer: '12px',
  } : {
    pad: '9mm', brand: '27px', title: '32px', small: '9px', tiny: '8.5px',
    body: '10px', body2: '10px', table: '9.5px', sku: '8.8px',
    policy: '8.8px', policyTitle: '10px', total: '10px', grand: '14px',
    footer: '14px',
  }

  return (
    <div
      id="invoice-print"
      style={{
        width: '100%',
        minHeight: isA5 ? '180mm' : '175mm',
        height: isA5 ? '180mm' : 'auto',
        boxSizing: 'border-box',
        padding: isA5 ? '7mm 6mm 6mm 10mm' : '10mm 9mm 9mm 14mm',
        position: 'relative',
        borderLeft: isA5 ? '5mm solid #3D8A70' : '6mm solid #3D8A70',
        background: '#fff',
        color: '#111',
        fontFamily: mainFont,
        fontSize: s.body,
        lineHeight: 1.3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* HEADER */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: '5mm',
        alignItems: 'start', paddingBottom: isA5 ? '4mm' : '5mm',
      }}>
        <div>
          <img
            src="/logo.png"
            alt="OLIVE LIVING"
            style={{
              display: 'block',
              width: isA5 ? '65mm' : '78mm',
              maxWidth: '100%',
              height: isA5 ? '20mm' : '24mm',
              objectFit: 'contain',
              objectPosition: 'left center',
            }}
          />
          <div style={{ marginTop: '3px', fontSize: s.tiny, color: '#555' }}>Furniture · Lighting · Living</div>
          <div style={{ marginTop: '3px', maxWidth: isA5 ? '76mm' : '100mm', fontSize: s.tiny, lineHeight: 1.25, color: '#444' }}>
            {isEnglish ? 'Address:' : 'Địa chỉ:'} KDC Khang Điền Bình Chánh, Đường Trịnh Quang Nghị,
            X. Phong Phú, H. Bình Chánh. HCM
          </div>
          <div style={{ marginTop: '2px', fontSize: s.tiny, color: '#444' }}>olivelivingvn.com · hello@olivelivingvn.com</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: s.tiny, fontWeight: 700, color: '#666', letterSpacing: '.8px' }}>{isEnglish ? 'SALES INVOICE' : 'SALES INVOICE'}</div>
          <div style={{ marginTop: '1px', fontSize: s.title, fontWeight: 700, lineHeight: 1 }}>{isEnglish ? 'INVOICE' : 'HÓA ĐƠN'}</div>
          <div style={{ marginTop: '4px', fontFamily: pixelFont, fontSize: s.small, fontWeight: 700 }}>#{orderCode}</div>
          <div style={{ marginTop: '2px', fontSize: s.tiny, color: '#555' }}>
            {isEnglish ? 'Date:' : 'Ngày:'} <span style={{ fontFamily: pixelFont, fontWeight: 700 }}>{date(orderDate)}</span>
          </div>
        </div>
      </div>

      {/* ORDER / CUSTOMER INFO */}
      <div style={{ marginTop: isA5 ? '3mm' : '4mm' }}>
        <div
          style={{
            fontSize: isA5 ? '12px' : '14px',
            fontWeight: 800,
            color: '#596548',
            background: 'transparent',
            padding: '0',
            borderLeft: 'none',
            borderRadius: 0,
            letterSpacing: '.5px',
            marginBottom: isA5 ? '5px' : '7px',
          }}
        >
          {isEnglish ? 'CUSTOMER INFORMATION' : 'THÔNG TIN KHÁCH HÀNG'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isA5 ? '3px 7mm' : '4mm 8mm', fontSize: s.body2 }}>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Customer:' : 'Khách hàng:'}</span> <strong>{customerTitle ? `${customerTitle} ` : ''}{customerName}</strong></div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Phone:' : 'SĐT:'}</span> <strong>{customerPhone}</strong></div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Customer ID:' : 'Mã KH:'}</span> <span style={{ fontFamily: pixelFont, fontWeight: 700 }}>{customerCode}</span></div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Source:' : 'Nguồn:'}</span> <strong>{customerSource}</strong></div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Email:' : 'Email:'}</span> {customerEmail || '-'}</div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Carrier:' : 'ĐVVC:'}</span> <strong>{shippingProvider}</strong></div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Shipping:' : 'Hình thức giao:'}</span> <strong>{displayedShippingMethod}</strong></div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Payment:' : 'Thanh toán:'}</span> <strong>{displayedPaymentMethod}</strong></div>
          <div><span style={{ color: '#666' }}>{isEnglish ? 'Amount paid:' : 'Đã thanh toán:'}</span> <strong>{money(paidAmount)}</strong></div>
          <div style={{ gridColumn: '1 / -1', lineHeight: 1.2 }}><span style={{ color: '#666' }}>{isEnglish ? 'Customer address:' : 'Địa chỉ khách hàng:'}</span> <strong>{customerAddress}</strong></div>
          <div style={{ gridColumn: '1 / -1', lineHeight: 1.2 }}><span style={{ color: '#666' }}>{isEnglish ? 'Note:' : 'Note:'}</span> {customerNote || '-'}</div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div style={{ marginTop: isA5 ? '3mm' : '4mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: mainFont }}>
          <colgroup>
            <col style={{ width: '6%' }} /><col style={{ width: '18%' }} /><col style={{ width: '29%' }} />
            <col style={{ width: '11%' }} /><col style={{ width: '7%' }} /><col style={{ width: '14%' }} /><col style={{ width: '15%' }} />
          </colgroup>
          <thead style={{ background: '#3D8A70', color: '#FFFFFF' }}>
            <tr>
              {(isEnglish ? ['NO.','SKU','PRODUCT','COLOR','QTY','UNIT PRICE','AMOUNT'] : ['STT','SKU','SẢN PHẨM','MÀU','SL','ĐƠN GIÁ','THÀNH TIỀN']).map((h,i)=>(
                <th key={h} style={{ padding: isA5 ? '4px 2px' : '6px 3px', fontFamily: mainFont, fontSize:s.table, fontWeight:700, textAlign:i===0||i===4?'center':i>=5?'right':'left', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item:any,index:number)=>{
              const sku = item?.sku || item?.product_sku || item?.productSku || item?.sku_master || item?.product?.sku || '-'
              const name = item?.product_name || item?.productName || item?.name || item?.product?.name || (isEnglish ? 'Product' : 'Sản phẩm')
              const color = item?.color || item?.variant_color || item?.variantColor || item?.product?.color || '-'
              const qty = Number(item?.quantity || item?.qty || item?.amount || 1)
              const unit = Number(item?.unit_price || item?.unitPrice || item?.price || item?.sale_price || item?.salePrice || item?.product?.sale_price || 0)
              const line = Number(item?.total_price || item?.totalPrice || item?.subtotal || item?.line_total || 0) || qty * unit
              return <tr key={item?.id || index}>
                <td style={{padding:'5px 2px',textAlign:'center',verticalAlign:'top',fontSize:s.table,borderBottom:'1px solid #D8D8D8'}}>{index+1}</td>
                <td style={{padding:'5px 2px',verticalAlign:'top',fontFamily:mainFont,fontSize:s.sku,fontWeight:700,wordBreak:'break-word',borderBottom:'1px solid #D8D8D8'}}>{sku}</td>
                <td style={{padding:'5px 2px',verticalAlign:'top',fontSize:s.table,fontWeight:600,lineHeight:1.2,wordBreak:'break-word',borderBottom:'1px solid #D8D8D8'}}>{name}</td>
                <td style={{padding:'5px 2px',verticalAlign:'top',fontFamily:mainFont,fontSize:s.table,fontWeight:700,whiteSpace:'nowrap',wordBreak:'normal',borderBottom:'1px solid #D8D8D8'}}>{color}</td>
                <td style={{padding:'5px 2px',textAlign:'center',verticalAlign:'top',fontFamily:mainFont,fontSize:s.table,fontWeight:700,borderBottom:'1px solid #D8D8D8'}}>{qty}</td>
                <td style={{padding:'5px 2px',textAlign:'right',verticalAlign:'top',fontSize:s.table,whiteSpace:'nowrap',borderBottom:'1px solid #D8D8D8'}}>{moneyArial(unit)}</td>
                <td style={{padding:'5px 2px',textAlign:'right',verticalAlign:'top',fontSize:s.table,fontWeight:600,whiteSpace:'nowrap',borderBottom:'1px solid #D8D8D8'}}>{moneyArial(line)}</td>
              </tr>
            }) : <tr><td colSpan={7} style={{padding:'6px',textAlign:'center',color:'#777',borderBottom:'1px solid #ECEDE7'}}>{isEnglish ? 'No products' : 'Không có sản phẩm'}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* TOTALS - FULL WIDTH, BALANCED SUMMARY */}
      <div
        style={{
          marginTop: isA5 ? '4mm' : '5mm',
          width: isA5 ? '68%' : '48%',
          marginLeft: 'auto',
          boxSizing: 'border-box',
          padding: isA5 ? '3mm 3mm' : '4mm 5mm',
          background: '#F1F6F3',
          borderRadius: '0',
          color: '#24291F',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            columnGap: '12px',
            rowGap: isA5 ? '5px' : '7px',
            fontSize: s.total,
          }}
        >
          <span style={{ color: '#626858' }}>{isEnglish ? 'Subtotal' : 'Tạm tính'}</span>
          <strong style={{ textAlign: 'right' }}>{money(subtotal)}</strong>

          {discount > 0 && (
            <>
              <span style={{ color: '#626858' }}>{isEnglish ? 'Discount' : 'Giảm giá'}</span>
              <strong style={{ textAlign: 'right' }}>- {money(discount)}</strong>
            </>
          )}

          {shippingFee > 0 && (
            <>
              <span style={{ color: '#626858' }}>{isEnglish ? 'Shipping fee' : 'Phí vận chuyển'}</span>
              <strong style={{ textAlign: 'right' }}>{money(shippingFee)}</strong>
            </>
          )}

          <span style={{ color: '#626858' }}>{isEnglish ? 'Payment' : 'Thanh toán'}</span>
          <strong style={{ textAlign: 'right', textTransform: 'uppercase' }}>
            {displayedPaymentMethod}
          </strong>
        </div>

        <div
          style={{
            marginTop: isA5 ? '8px' : '10px',
            paddingTop: isA5 ? '7px' : '9px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            columnGap: '12px',
            rowGap: isA5 ? '6px' : '8px',
          }}
        >
          <strong style={{ fontSize: s.total, letterSpacing: '.2px' }}>
            {isEnglish ? 'GRAND TOTAL' : 'TỔNG CỘNG'}
          </strong>
          <strong
            style={{
              fontSize: s.grand,
              color: '#24291F',
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}
          >
            {money(totalAmount)}
          </strong>

          <span style={{ fontSize: s.total, color: '#626858' }}>
            {isEnglish ? 'Amount paid' : 'Đã thanh toán'}
          </span>
          <strong style={{ fontSize: s.total, textAlign: 'right' }}>
            {money(paidAmount)}
          </strong>
        </div>

        <div
          style={{
            marginTop: isA5 ? '8px' : '10px',
            padding: isA5 ? '6px 0 2px' : '8px 0 2px',
            borderRadius: 0,
            background: 'transparent',
            color: '#24291F',
            borderTop: '1px solid #AAB8B0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <strong style={{ fontSize: s.total, letterSpacing: '.25px' }}>
            {isEnglish ? 'BALANCE DUE' : 'CÒN THANH TOÁN'}
          </strong>
          <strong
            style={{
              fontFamily: pixelFont,
              fontSize: isA5 ? '17px' : '20px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
            }}
          >
            {money(remaining)}
          </strong>
        </div>
      </div>

      {/* RETURN POLICY */}
<div
  style={{
    marginTop: isA5 ? '4mm' : '5mm',
    paddingTop: isA5 ? '2.5mm' : '3mm',
    fontSize: s.policy,
    lineHeight: isA5 ? 1.5 : 1.55,
    color: '#333',
  }}
>
  <div
    style={{
      fontSize: isA5 ? '12px' : '14px',
      fontWeight: 700,
      lineHeight: 1.3,
      marginBottom: isA5 ? '4px' : '5px',
    }}
  >
    {isEnglish ? 'RETURN POLICY' : 'CHÍNH SÁCH ĐỔI TRẢ'}
  </div>

  <div style={{ marginBottom: isA5 ? '3px' : '4px' }}>
    <strong>{isEnglish ? 'Timeframe:' : 'Thời gian:'}</strong>{' '}
          {isEnglish ? <>Within <strong>15 days</strong> from the date the carrier confirms successful delivery.</> : <>Trong vòng <strong>15 ngày</strong> kể từ ngày ĐVVC xác nhận giao thành công.</>}
  </div>

  <div style={{ marginBottom: isA5 ? '3px' : '4px' }}>
    <strong>{isEnglish ? 'Eligible cases:' : 'Hỗ trợ đổi:'}</strong>{' '}
    {isEnglish
      ? 'Manufacturing or technical defects, or damage during shipping. Items must be unused and include the original box, packaging, and accessories. Photos or videos are required when reporting an issue.'
      : 'Lỗi sản xuất/kỹ thuật hoặc bể vỡ do vận chuyển; sản phẩm chưa qua sử dụng, còn hộp, bao bì và phụ kiện; cung cấp hình ảnh/video khi phát hiện vấn đề.'}
  </div>

  <div style={{ marginBottom: isA5 ? '3px' : '4px' }}>
    <strong>{isEnglish ? 'Non-returnable cases:' : 'Không hỗ trợ đổi:'}</strong>{' '}
    {isEnglish
      ? 'Damage caused by improper use, installation, or storage; breakage, cracks, dents, or wear caused by the customer; or missing box, packaging, or accessories that affect inspection.'
      : 'Hư hỏng do sử dụng, lắp đặt hoặc bảo quản sai; bể/nứt/móp/hao mòn do khách hàng; thiếu hộp, bao bì hoặc phụ kiện ảnh hưởng việc kiểm tra.'}
  </div>

  <div style={{ marginTop: isA5 ? '3px' : '4px' }}>
    {isEnglish ? 'More details:' : 'Xem chi tiết:'}{' '}
    <a
      href="https://olivelivingvn.com/chinh-sach-doi-hang"
      style={{
        color: '#222',
        textDecoration: 'none',
        fontStyle: 'italic',
        fontWeight: 700,
      }}
    >
      Olivelivingvn.com/chinh-sach-doi-hang
    </a>
  
  </div>
</div>

{/* THANK YOU */}
<div
  style={{
    marginTop: isA5 ? '7mm' : '9mm',
    paddingTop: isA5 ? '3mm' : '4mm',
    paddingBottom: isA5 ? '3mm' : '5mm',
    textAlign: 'center',
    fontFamily: mainFont,
  }}
>
  <div
    style={{
      fontSize: s.footer,
      fontWeight: 700,
      lineHeight: 1.1,
    }}
  >
    {isEnglish ? 'THANK YOU FOR YOUR ORDER!' : 'CẢM ƠN QUÝ KHÁCH!'}
  </div>

  <div style={{ marginTop: '2px', fontSize: s.tiny, color: '#444' }}>
    {isEnglish ? 'Thank you for shopping with Olive Living.' : 'Cảm ơn Quý khách đã mua sắm tại Olive Living.'}
  </div>

  <div style={{ marginTop: '1px', fontSize: s.tiny, color: '#777' }}>
    OLIVE LIVING · Furniture · Lighting · Living
  </div>
</div>

</div>
  )
}
