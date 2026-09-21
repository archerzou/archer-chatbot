import { Link } from "react-router-dom"
import { formatPrice } from "@/lib/utils"
import type { ProductItem } from "../types"

/** Compact product comparison table (design section B3), used when several products match. */
export function ResultTable({ products }: { products: ProductItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-2.5 py-1.5 font-medium">Product</th>
            <th className="px-2.5 py-1.5 font-medium">Price</th>
            <th className="px-2.5 py-1.5" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.productId} className="border-t">
              <td className="px-2.5 py-1.5">
                <div className="font-medium">{product.model}</div>
                <div className="text-muted-foreground">{product.brand}</div>
              </td>
              <td className="px-2.5 py-1.5 font-semibold">{formatPrice(product.price)}</td>
              <td className="px-2.5 py-1.5 text-right">
                <Link
                  to={`/products/${product.productId}`}
                  className="font-medium text-primary hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
