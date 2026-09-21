import { useCallback, useRef, useState } from "react"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/problem"
import { userManager } from "@/features/auth/oidc"
import * as api from "./api"
import { conversationKeys } from "./useConversations"
import { useChatSession } from "./store"
import { streamChat, type ChatStreamEvent } from "./chat-stream"
import { addCategories, addProducts, appendText, mergeCitations, setSearching } from "./message-blocks"
import { newMessage, type ChatMessage, type Conversation, type ContentBlock } from "./types"

/**
 * Sends a message and streams the assistant reply into the active conversation's query cache
 * (design C5 / Phase 3.8). New conversations are created server-side first so there is a real id to
 * key the cache and stream against; on completion the list + detail queries are invalidated so
 * title/preview/updatedAt refresh from the server.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()
  const activeId = useChatSession((s) => s.activeId)
  const setActiveId = useChatSession((s) => s.setActiveId)
  const abortRef = useRef<AbortController | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const send = useCallback(
    async (text: string) => {
      let conversationId = activeId

      // Create the conversation up front (new chat) so we have an id + cache entry to stream into.
      if (!conversationId) {
        try {
          const created = await api.createConversation()
          queryClient.setQueryData<Conversation>(conversationKeys.detail(created.id), created)
          setActiveId(created.id)
          conversationId = created.id
          void queryClient.invalidateQueries({ queryKey: conversationKeys.list })
        } catch (err) {
          toast.error(getErrorMessage(err))
          return
        }
      }

      const id = conversationId
      const userMessage = newMessage("user", text)
      const assistant = newMessage("assistant", "", "streaming")
      patchDetail(queryClient, id, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, userMessage, assistant],
      }))

      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)

      const patchAssistant = (update: (message: ChatMessage) => ChatMessage) =>
        patchMessage(queryClient, id, assistant.id, update)

      try {
        const user = await userManager.getUser()
        await streamChat(
          { conversationId: Number(id), message: text },
          {
            token: user?.access_token,
            signal: controller.signal,
            onEvent: (event) => handleEvent(event, patchAssistant),
          }
        )
        patchAssistant((message) => finalize(message))
        void queryClient.invalidateQueries({ queryKey: conversationKeys.list })
        void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) })
      } catch (err) {
        if (controller.signal.aborted) {
          patchAssistant((message) => finalize(message))
          void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) })
        } else {
          patchAssistant((message) => ({ ...message, status: "error" }))
          toast.error(getErrorMessage(err))
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [activeId, queryClient, setActiveId]
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  return { send, stop, isStreaming }
}

function handleEvent(event: ChatStreamEvent, patch: (fn: (m: ChatMessage) => ChatMessage) => void) {
  switch (event.type) {
    case "token":
      patch((m) => ({ ...m, blocks: setSearching(appendText(m.blocks, event.text), null) }))
      break
    case "search":
      patch((m) => ({ ...m, blocks: setSearching(m.blocks, event.phrase) }))
      break
    case "block":
      patch((m) => ({ ...m, blocks: applyBlock(m.blocks, event.block) }))
      break
    case "done":
      patch((m) => finalize(m))
      break
    case "error":
      patch((m) => ({ ...m, status: "error" }))
      toast.error(event.message)
      break
  }
}

function applyBlock(blocks: ContentBlock[], block: Exclude<ContentBlock, { kind: "searching" }>): ContentBlock[] {
  switch (block.kind) {
    case "text":
      return appendText(blocks, block.text)
    case "citations":
      return mergeCitations(blocks, block.citations)
    case "products":
      return addProducts(blocks, block.products)
    case "categories":
      return addCategories(blocks, block.categories)
  }
}

/** Mark a streaming message complete and drop the transient searching affordance. */
function finalize(message: ChatMessage): ChatMessage {
  if (message.status !== "streaming") return message
  return { ...message, status: "complete", blocks: setSearching(message.blocks, null) }
}

function patchDetail(queryClient: QueryClient, id: string, update: (conversation: Conversation) => Conversation) {
  queryClient.setQueryData<Conversation>(conversationKeys.detail(id), (conversation) =>
    conversation ? update(conversation) : conversation
  )
}

function patchMessage(
  queryClient: QueryClient,
  id: string,
  messageId: string,
  update: (message: ChatMessage) => ChatMessage
) {
  patchDetail(queryClient, id, (conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => (message.id === messageId ? update(message) : message)),
  }))
}
