import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/problem"
import { useAuthStore } from "@/stores/auth"
import * as api from "./api"
import { useChatSession } from "./store"
import type { Conversation, ConversationSummary } from "./types"

// Server-backed conversation history via TanStack Query (design C3 / Phase 3). The list and each
// conversation's messages are cached query data; mutations update the caches optimistically.

export const conversationKeys = {
  list: ["conversations"] as const,
  detail: (id: string) => ["conversation", id] as const,
}

export function useConversations() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: conversationKeys.list,
    queryFn: api.listConversations,
    enabled: !!user,
  })
}

export function useConversation(id: string | null) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ""),
    queryFn: () => api.getConversation(id!),
    enabled: !!user && !!id,
  })
}

export function useRenameConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.renameConversation(id, title),
    onMutate: ({ id, title }) => {
      const previous = snapshot(queryClient, id)
      patchSummary(queryClient, id, (c) => ({ ...c, title }))
      queryClient.setQueryData<Conversation>(conversationKeys.detail(id), (c) =>
        c ? { ...c, title } : c
      )
      return previous
    },
    onError: (error, _vars, context) => {
      restore(queryClient, context)
      toast.error(getErrorMessage(error))
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  const activeId = useChatSession((s) => s.activeId)
  const setActiveId = useChatSession((s) => s.setActiveId)
  return useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onMutate: (id) => {
      const previous = snapshot(queryClient, id)
      queryClient.setQueryData<ConversationSummary[]>(conversationKeys.list, (list) =>
        list?.filter((c) => c.id !== id)
      )
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) })
      if (activeId === id) setActiveId(null)
      return previous
    },
    onError: (error, _id, context) => {
      restore(queryClient, context)
      toast.error(getErrorMessage(error))
    },
  })
}

// --- optimistic-cache helpers ---

interface Snapshot {
  id: string
  list?: ConversationSummary[]
  detail?: Conversation
}

function snapshot(queryClient: QueryClient, id: string): Snapshot {
  return {
    id,
    list: queryClient.getQueryData<ConversationSummary[]>(conversationKeys.list),
    detail: queryClient.getQueryData<Conversation>(conversationKeys.detail(id)),
  }
}

function restore(queryClient: QueryClient, context: Snapshot | undefined) {
  if (!context) return
  queryClient.setQueryData(conversationKeys.list, context.list)
  if (context.detail) queryClient.setQueryData(conversationKeys.detail(context.id), context.detail)
}

function patchSummary(
  queryClient: QueryClient,
  id: string,
  update: (summary: ConversationSummary) => ConversationSummary
) {
  queryClient.setQueryData<ConversationSummary[]>(conversationKeys.list, (list) =>
    list?.map((c) => (c.id === id ? update(c) : c))
  )
}
