import { Badge } from '@/components/ui/badge'

export function StockBadge({
  stock,
  minStock,
}: {
  stock: number
  minStock: number
}) {
  if (stock <= 0) return <Badge variant="destructive">Habis</Badge>
  if (stock <= minStock) return <Badge variant="warning">Menipis</Badge>
  return <Badge variant="success">Tersedia</Badge>
}
