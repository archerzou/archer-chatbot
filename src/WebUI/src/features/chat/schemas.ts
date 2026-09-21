import { z } from "zod"
import type { ChatMessage, Conversation, ConversationSummary, ContentBlock } from "./types"

// Boundary validation for the Backend chat contracts (Backend/Api/ChatContracts.cs). Server ids are
// integers and timestamps are ISO strings; we normalize them to the frontend's `string` id /
// `number` epoch conventions here so the rest of the feature works with a single shape.

const IdSchema = z.union([z.number(), z.string()]).transform(String)
const DateSchema = z.union([z.string(), z.number()]).transform((v) => new Date(v).getTime())

const CitationSchema = z.object({
  searchResultId: z.number(),
  productId: z.number().nullable(),
  page: z.number().nullable(),
  snippet: z.string().nullable().optional(),
})

const ProductItemSchema = z.object({
  productId: z.number(),
  brand: z.string(),
  model: z.string(),
  price: z.number(),
  categoryName: z.string().nullable().optional(),
})

const CategoryItemSchema = z.object({
  categoryId: z.number(),
  name: z.string(),
})

/** A persisted/streamed content block (the `searching` kind is client-only, never from the server). */
export const ServerBlockSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("citations"), citations: z.array(CitationSchema) }),
  z.object({ kind: z.literal("products"), products: z.array(ProductItemSchema) }),
  z.object({ kind: z.literal("categories"), categories: z.array(CategoryItemSchema) }),
]) satisfies z.ZodType<Exclude<ContentBlock, { kind: "searching" }>>

const ChatMessageSchema: z.ZodType<ChatMessage> = z
  .object({
    id: IdSchema,
    role: z.enum(["user", "assistant"]),
    blocks: z.array(ServerBlockSchema),
    createdAt: DateSchema,
  })
  .transform((m) => ({ ...m, status: "complete" as const }))

export const ConversationSummarySchema: z.ZodType<ConversationSummary> = z.object({
  id: IdSchema,
  title: z.string(),
  preview: z.string().nullable().transform((v) => v ?? null),
  updatedAt: DateSchema,
})

export const ConversationSummaryListSchema = z.array(ConversationSummarySchema)

export const ConversationSchema: z.ZodType<Conversation> = z.object({
  id: IdSchema,
  title: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  messages: z.array(ChatMessageSchema),
})

export const CreateConversationSchema = z.object({
  id: IdSchema,
  title: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
})
