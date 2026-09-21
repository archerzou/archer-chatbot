export type MessageRole = "user" | "assistant"
export type MessageStatus = "streaming" | "complete" | "error"

// Typed content blocks (design section B3). These mirror the Backend's `ChatBlock` contract
// (Backend/Api/ChatContracts.cs) served over SSE and persisted history: `text`, `citations`,
// `products`, `categories`. `searching` is a client-only transient affordance shown while a tool
// call runs; it is never persisted.
export interface TextBlock {
  kind: "text"
  text: string
}

/** One manual reference. `searchResultId` ties an inline `<cite>` in the answer to a product/page. */
export interface Citation {
  searchResultId: number
  productId: number | null
  page: number | null
  snippet?: string | null
}
export interface CitationsBlock {
  kind: "citations"
  citations: Citation[]
}

/** A catalog product rendered as a card / table row. */
export interface ProductItem {
  productId: number
  brand: string
  model: string
  price: number
  categoryName?: string | null
}
export interface ProductsBlock {
  kind: "products"
  products: ProductItem[]
}

/** A category suggestion rendered as a chip that re-queries on click. */
export interface CategoryItem {
  categoryId: number
  name: string
}
export interface CategoriesBlock {
  kind: "categories"
  categories: CategoryItem[]
}

/** Transient "searching the manual…" affordance shown while the assistant runs a tool call. */
export interface SearchingBlock {
  kind: "searching"
  phrase: string
}

export type ContentBlock =
  | TextBlock
  | CitationsBlock
  | ProductsBlock
  | CategoriesBlock
  | SearchingBlock

export interface ChatMessage {
  id: string
  role: MessageRole
  blocks: ContentBlock[]
  createdAt: number
  status: MessageStatus
}

/** A conversation summary as shown in the history list. */
export interface ConversationSummary {
  id: string
  title: string
  preview: string | null
  updatedAt: number
}

/** A full conversation with its messages. */
export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export function newMessage(
  role: MessageRole,
  text: string,
  status: MessageStatus = "complete"
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    blocks: [{ kind: "text", text }],
    createdAt: Date.now(),
    status,
  }
}

/** Concatenated text of a message's text blocks. */
export function messageText(message: ChatMessage): string {
  return message.blocks
    .filter((block): block is TextBlock => block.kind === "text")
    .map((block) => block.text)
    .join("")
}

/** The message's collected citations, if any (there is at most one citations block). */
export function messageCitations(message: ChatMessage): Citation[] {
  return message.blocks.find((b): b is CitationsBlock => b.kind === "citations")?.citations ?? []
}

/** All products carried by the message (across any number of product blocks). */
export function messageProducts(message: ChatMessage): ProductItem[] {
  return message.blocks
    .filter((b): b is ProductsBlock => b.kind === "products")
    .flatMap((b) => b.products)
}

/** All category suggestions carried by the message. */
export function messageCategories(message: ChatMessage): CategoryItem[] {
  return message.blocks
    .filter((b): b is CategoriesBlock => b.kind === "categories")
    .flatMap((b) => b.categories)
}
