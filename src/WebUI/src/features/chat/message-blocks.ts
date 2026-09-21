import type {
  CategoriesBlock,
  CategoryItem,
  Citation,
  CitationsBlock,
  ContentBlock,
  ProductItem,
  ProductsBlock,
} from "./types"

// Pure, immutable transforms over a message's content blocks, applied while streaming an assistant
// reply into the query cache (useSendMessage.ts). Kept separate from React/query so they're trivial
// to reason about and reuse.

/** Appends a chunk to the trailing text block, or starts one after any structured/search blocks. */
export function appendText(blocks: ContentBlock[], chunk: string): ContentBlock[] {
  const last = blocks[blocks.length - 1]
  if (last?.kind === "text") {
    return [...blocks.slice(0, -1), { kind: "text", text: last.text + chunk }]
  }
  return [...blocks, { kind: "text", text: chunk }]
}

/** Adds or removes the single transient searching block. Passing `null` clears it. */
export function setSearching(blocks: ContentBlock[], phrase: string | null): ContentBlock[] {
  const without = blocks.filter((b) => b.kind !== "searching")
  return phrase === null ? without : [...without, { kind: "searching", phrase }]
}

/** Merges into the single citations block, de-duped by searchResultId (later entries fill gaps). */
export function mergeCitations(blocks: ContentBlock[], incoming: Citation[]): ContentBlock[] {
  const existing = blocks.find((b): b is CitationsBlock => b.kind === "citations")
  const byId = new Map<number, Citation>()
  for (const c of [...(existing?.citations ?? []), ...incoming]) {
    const prev = byId.get(c.searchResultId)
    byId.set(c.searchResultId, {
      searchResultId: c.searchResultId,
      productId: c.productId ?? prev?.productId ?? null,
      page: c.page ?? prev?.page ?? null,
      snippet: c.snippet ?? prev?.snippet ?? null,
    })
  }
  const merged: CitationsBlock = { kind: "citations", citations: [...byId.values()] }
  return existing ? blocks.map((b) => (b === existing ? merged : b)) : [...blocks, merged]
}

/** Appends a products block (dropping the searching affordance, which precedes results). */
export function addProducts(blocks: ContentBlock[], products: ProductItem[]): ContentBlock[] {
  const block: ProductsBlock = { kind: "products", products }
  return [...setSearching(blocks, null), block]
}

/** Appends a categories block. */
export function addCategories(blocks: ContentBlock[], categories: CategoryItem[]): ContentBlock[] {
  const block: CategoriesBlock = { kind: "categories", categories }
  return [...setSearching(blocks, null), block]
}
