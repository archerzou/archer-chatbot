import { z } from "zod"

/**
 * Business-data entities the chatbot renders as cards. `/api/products` returns the minimal
 * `{ productId, brand, model }`; the extra fields exist in the seed data / customer search and are
 * optional here so both shapes validate.
 */
export const ProductSchema = z.object({
  productId: z.number().int(),
  brand: z.string(),
  model: z.string(),
  categoryId: z.number().int().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
})
export type Product = z.infer<typeof ProductSchema>

export const CategorySchema = z.object({
  categoryId: z.number().int(),
  name: z.string(),
})
export type Category = z.infer<typeof CategorySchema>

export const ProductListSchema = z.array(ProductSchema)
export const CategoryListSchema = z.array(CategorySchema)
