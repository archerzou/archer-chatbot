import { Link } from "react-router-dom"
import { formatPrice } from "@/lib/utils"
import type { ProductItem } from "../types"

/** Single product match rendered as a card (design section B3). */
export function ProductCard({ product }: { product: ProductItem }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-sm font-medium">{product.model}</div>
      <div className="text-xs text-muted-foreground">
        {product.brand}
        {product.categoryName ? ` · ${product.categoryName}` : ""}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
        <Link
          to={`/products/${product.productId}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View
        </Link>
      </div>
    </div>
  )
}
