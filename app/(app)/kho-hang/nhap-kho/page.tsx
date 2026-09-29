import { supabase } from '@/lib/supabase'
import NhapKhoForm from './nhap-kho-form'

export const dynamic = 'force-dynamic'

export default async function NhapKhoPage() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sku')

  return (
    <NhapKhoForm
      products={products || []}
    />
  )
}