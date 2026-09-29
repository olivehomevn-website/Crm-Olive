'use client'

type InvoicePaperSize = 'A4' | 'A5'

export default function InvoicePrint({
  order,
  paperSize = 'A5',
}: {
  order: any
  paperSize?: InvoicePaperSize
}) {
  const isA5 = paperSize === 'A5'
  const mainFont = 'Arial, Helvetica, sans-serif'
  const pixelFont = '"Pixel Operator", "Pixeloid Sans", "Silkscreen", "Press Start 2P", "Courier New", monospace'

  const money = (v: any) => Number(v || 0).toLocaleString('vi-VN') + ' đ'
  const date = (v: any) => {
    if (!v) return '-'
    try { return new Date(v).toLocaleDateString('vi-VN') } catch { return '-' }
  }
  const address = (v: any) => {
    if (!v) return ''
    if (typeof v === 'string') return v.trim()
    if (typeof v === 'object') {
      const p = [
        v.address, v.full_address, v.fullAddress, v.street, v.street_address,
        v.streetAddress, v.ward, v.ward_name, v.wardName, v.district,
        v.district_name, v.districtName, v.province, v.province_name,
        v.provinceName, v.city, v.city_name, v.cityName,
      ].filter(Boolean).map(String).map(x => x.trim()).filter(Boolean)
      return [...new Set(p)].join(', ')
    }
    return String(v)
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
  const shippingAddress = order?.shipping_address || order?.shippingAddress || order?.delivery_address || order?.deliveryAddress || customer?.shipping_address || customer?.shippingAddress
  const customerAddress = address(order?.customer_address) || address(order?.customerAddress) || address(shippingAddress) || address(customer?.address) || '-'

  const orderCode = order?.order_code || order?.orderCode || order?.code || order?.order_number || order?.orderNumber || order?.id || '-'
  const orderDate = order?.order_date || order?.orderDate || order?.created_at || order?.createdAt
  const paymentMethod = order?.payment_method || order?.paymentMethod || 'COD'
  const paidAmount = Number(order?.paid_amount || order?.paidAmount || 0)
  const totalAmount = Number(order?.total_amount || order?.totalAmount || order?.grand_total || order?.grandTotal || order?.total || 0)
  const remaining = Math.max(totalAmount - paidAmount, 0)
  const discount = Number(order?.discount_amount || order?.discountAmount || order?.discount || 0)
  const shippingFee = Number(order?.shipping_fee || order?.shippingFee || order?.delivery_fee || 0)
  const subtotal = Number(order?.subtotal || order?.sub_total || order?.subtotal_amount || Math.max(totalAmount - shippingFee + discount, 0))
  const items = order?.items || order?.order_items || order?.orderItems || order?.products || []

  const s = isA5 ? {
    pad: '7mm',
    brand: '21px', title: '25px', small: '7.6px', tiny: '7px',
    body: '8.6px', body2: '8.4px', table: '8px', sku: '7.4px',
    policy: '7.2px', policyTitle: '8.4px', total: '8.4px', grand: '12px',
    footer: '12px',
  } : {
    pad: '11mm', brand: '27px', title: '32px', small: '8.5px', tiny: '8px',
    body: '10px', body2: '9.5px', table: '9.5px', sku: '8.8px',
    policy: '8.3px', policyTitle: '10px', total: '10px', grand: '14px',
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
        padding: s.pad,
        background: '#fff',
        color: '#111',
        fontFamily: mainFont,
        fontSize: s.body,
        lineHeight: 1.3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isA5 ? 'space-between' : 'flex-start',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* HEADER */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: '5mm',
        alignItems: 'start', paddingBottom: isA5 ? '4mm' : '5mm',
        borderBottom: '1px solid #111',
      }}>
        <div>
          <div style={{ fontSize: s.brand, fontWeight: 700, lineHeight: 1 }}>OLIVE LIVING</div>
          <div style={{ marginTop: '3px', fontSize: s.tiny, color: '#555' }}>Furniture · Lighting · Living</div>
          <div style={{ marginTop: '2px', fontSize: s.tiny, color: '#444' }}>olivelivingvn.com · hello@olivelivingvn.com</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: s.tiny, fontWeight: 700, color: '#666', letterSpacing: '.8px' }}>SALES INVOICE</div>
          <div style={{ marginTop: '1px', fontSize: s.title, fontWeight: 700, lineHeight: 1 }}>HÓA ĐƠN</div>
          <div style={{ marginTop: '4px', fontFamily: pixelFont, fontSize: s.small, fontWeight: 700 }}>#{orderCode}</div>
          <div style={{ marginTop: '2px', fontSize: s.tiny, color: '#555' }}>Ngày: {date(orderDate)}</div>
        </div>
      </div>

      {/* ORDER / CUSTOMER INFO */}
      <div style={{ marginTop: isA5 ? '5mm' : '6mm' }}>
        <div style={{ fontSize: s.tiny, fontWeight: 700, letterSpacing: '.3px', marginBottom: '3px' }}>THÔNG TIN KHÁCH HÀNG</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isA5 ? '3px 7mm' : '4mm 8mm', fontSize: s.body2 }}>
          <div><span style={{ color: '#666' }}>Khách hàng:</span> <strong>{customerTitle ? `${customerTitle} ` : ''}{customerName}</strong></div>
          <div><span style={{ color: '#666' }}>SĐT:</span> {customerPhone}</div>
          <div><span style={{ color: '#666' }}>Mã KH:</span> <span style={{ fontFamily: pixelFont, fontWeight: 700 }}>{customerCode}</span></div>
          <div><span style={{ color: '#666' }}>Nguồn:</span> {customerSource}</div>
          <div><span style={{ color: '#666' }}>Email:</span> {customerEmail || '-'}</div>
          <div><span style={{ color: '#666' }}>ĐVVC:</span> {shippingProvider}</div>
          <div><span style={{ color: '#666' }}>Hình thức giao:</span> {shippingMethod}</div>
          <div><span style={{ color: '#666' }}>Thanh toán:</span> {paymentMethod}</div>
          <div><span style={{ color: '#666' }}>Đã thanh toán:</span> {money(paidAmount)}</div>
          <div style={{ gridColumn: '1 / -1', lineHeight: 1.2 }}><span style={{ color: '#666' }}>Địa chỉ:</span> {customerAddress}</div>
          <div style={{ gridColumn: '1 / -1', lineHeight: 1.2 }}><span style={{ color: '#666' }}>Note:</span> {customerNote || '-'}</div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div style={{ marginTop: isA5 ? '5mm' : '6mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: mainFont }}>
          <colgroup>
            <col style={{ width: '6%' }} /><col style={{ width: '19%' }} /><col style={{ width: '31%' }} />
            <col style={{ width: '9%' }} /><col style={{ width: '7%' }} /><col style={{ width: '13%' }} /><col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr>
              {['STT','SKU','SẢN PHẨM','MÀU','SL','ĐƠN GIÁ','THÀNH TIỀN'].map((h,i)=>(
                <th key={h} style={{ padding: isA5 ? '4px 2px' : '6px 3px', borderTop:'1px solid #111', borderBottom:'1px solid #111', fontSize:s.table, fontWeight:700, textAlign:i===0||i===4?'center':i>=5?'right':'left', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item:any,index:number)=>{
              const sku = item?.sku || item?.product_sku || item?.productSku || item?.sku_master || item?.product?.sku || '-'
              const name = item?.product_name || item?.productName || item?.name || item?.product?.name || 'Sản phẩm'
              const color = item?.color || item?.variant_color || item?.variantColor || item?.product?.color || '-'
              const qty = Number(item?.quantity || item?.qty || item?.amount || 1)
              const unit = Number(item?.unit_price || item?.unitPrice || item?.price || item?.sale_price || item?.salePrice || item?.product?.sale_price || 0)
              const line = Number(item?.total_price || item?.totalPrice || item?.subtotal || item?.line_total || 0) || qty * unit
              return <tr key={item?.id || index}>
                <td style={{padding:'4px 2px',borderBottom:'1px solid #ddd',textAlign:'center',verticalAlign:'top',fontSize:s.table}}>{index+1}</td>
                <td style={{padding:'4px 2px',borderBottom:'1px solid #ddd',verticalAlign:'top',fontFamily:pixelFont,fontSize:s.sku,fontWeight:700,wordBreak:'break-word'}}>{sku}</td>
                <td style={{padding:'4px 2px',borderBottom:'1px solid #ddd',verticalAlign:'top',fontSize:s.table,fontWeight:600,lineHeight:1.2,wordBreak:'break-word'}}>{name}</td>
                <td style={{padding:'4px 2px',borderBottom:'1px solid #ddd',verticalAlign:'top',fontSize:s.table,wordBreak:'break-word'}}>{color}</td>
                <td style={{padding:'4px 2px',borderBottom:'1px solid #ddd',textAlign:'center',verticalAlign:'top',fontSize:s.table}}>{qty}</td>
                <td style={{padding:'4px 2px',borderBottom:'1px solid #ddd',textAlign:'right',verticalAlign:'top',fontSize:s.table,whiteSpace:'nowrap'}}>{money(unit)}</td>
                <td style={{padding:'4px 2px',borderBottom:'1px solid #ddd',textAlign:'right',verticalAlign:'top',fontSize:s.table,fontWeight:600,whiteSpace:'nowrap'}}>{money(line)}</td>
              </tr>
            }) : <tr><td colSpan={7} style={{padding:'6px',textAlign:'center',color:'#777',borderBottom:'1px solid #ddd'}}>Không có sản phẩm</td></tr>}
          </tbody>
        </table>
      </div>

      {/* TOTALS */}
      <div style={{ marginTop: isA5 ? '5mm' : '5mm', display:'flex', justifyContent:'flex-end' }}>
        <div style={{ width:isA5?'72mm':'82mm', maxWidth:'100%' }}>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:s.total,padding:'3px 0'}}><span>Tạm tính</span><strong>{money(subtotal)}</strong></div>
          {discount>0 && <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:s.total,padding:'3px 0'}}><span>Giảm giá</span><strong>- {money(discount)}</strong></div>}
          {shippingFee>0 && <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:s.total,padding:'3px 0'}}><span>Phí vận chuyển</span><strong>{money(shippingFee)}</strong></div>}
          <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:s.total,padding:'3px 0',color:'#555'}}><span>Thanh toán</span><strong style={{textTransform:'uppercase'}}>{paymentMethod}</strong></div>
          <div style={{marginTop:'2px',paddingTop:'4px',borderTop:'1px solid #111',display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}><strong style={{fontSize:s.total}}>TỔNG CỘNG</strong><strong style={{fontSize:s.grand,whiteSpace:'nowrap'}}>{money(totalAmount)}</strong></div>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:s.total,padding:'3px 0'}}><span>Đã thanh toán</span><strong>{money(paidAmount)}</strong></div>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:s.total,padding:'3px 0',fontWeight:700}}><span>CÒN THANH TOÁN</span><strong>{money(remaining)}</strong></div>
        </div>
      </div>

      {/* RETURN POLICY */}
      <div style={{ marginTop:isA5?'5mm':'6mm', paddingTop:isA5?'3mm':'4mm', borderTop:'1px solid #ccc', fontSize:s.policy, lineHeight:isA5?1.28:1.3, color:'#333' }}>
        <div style={{fontSize:s.policyTitle,fontWeight:700,marginBottom:'2px'}}>CHÍNH SÁCH ĐỔI TRẢ</div>
        <div><strong>Thời gian:</strong> Trong vòng <strong>15 ngày</strong> kể từ ngày ĐVVC xác nhận giao thành công.</div>
        <div><strong>Hỗ trợ đổi:</strong> Lỗi sản xuất/kỹ thuật hoặc bể vỡ do vận chuyển; sản phẩm chưa qua sử dụng, còn hộp, bao bì và phụ kiện; cung cấp hình ảnh/video khi phát hiện vấn đề.</div>
        <div><strong>Không hỗ trợ đổi:</strong> Hư hỏng do sử dụng, lắp đặt hoặc bảo quản sai; bể/nứt/móp/hao mòn do khách hàng; thiếu hộp, bao bì hoặc phụ kiện ảnh hưởng việc kiểm tra.</div>
        <div style={{marginTop:'2px'}}>Xem chi tiết: <a href="https://olivelivingvn.com/chinh-sach-doi-hang" style={{color:'#333',textDecoration:'none',fontStyle:'italic'}}>Olivelivingvn.com/chinh-sach-doi-hang</a></div>
      </div>

      {/* THANK YOU */}
      <div style={{ marginTop:isA5?'5mm':'7mm', paddingTop:isA5?'4mm':'5mm', paddingBottom:isA5?'3mm':'5mm', textAlign:'center', borderTop:'1px solid #111', fontFamily:mainFont }}>
        <div style={{fontSize:s.footer,fontWeight:700,lineHeight:1.1}}>CẢM ƠN QUÝ KHÁCH!</div>
        <div style={{marginTop:'2px',fontSize:s.tiny,color:'#444'}}>Cảm ơn Quý khách đã mua sắm tại Olive Living.</div>
        <div style={{marginTop:'1px',fontSize:s.tiny,color:'#777'}}>OLIVE LIVING · Furniture · Lighting · Living</div>
      </div>
    </div>
  )
}
