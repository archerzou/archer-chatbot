import { api } from "@/lib/axios"
import type { Conversation, ConversationSummary } from "./types"
import {
  ConversationSchema,
  ConversationSummaryListSchema,
  CreateConversationSchema,
} from "./schemas"

// Server-backed conversation CRUD (design section D / Phase 3). Responses are validated at the
// boundary (schemas.ts) so the rest of the feature works with normalized shapes.

export async function listConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get("/api/conversations")
  return ConversationSummaryListSchema.parse(data)
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await api.get(`/api/conversations/${id}`)
  return ConversationSchema.parse(data)
}

export async function createConversation(): Promise<Conversation> {
  const { data } = await api.post("/api/conversations")
  const created = CreateConversationSchema.parse(data)
  return { ...created, messages: [] }
}

export async function renameConversation(id: string, title: string): Promise<void> {
  await api.patch(`/api/conversations/${id}`, { title })
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`/api/conversations/${id}`)
}
