import { create } from "zustand"

/**
 * Ephemeral chat-session UI state (design C3 / Phase 3). Conversation data and history are now
 * server state owned by TanStack Query (useConversations.ts); this store only tracks which
 * conversation is active. `null` = the welcome / new-chat state.
 */
interface ChatSessionState {
  activeId: string | null
  setActiveId: (id: string | null) => void
}

export const useChatSession = create<ChatSessionState>((set) => ({
  activeId: null,
  setActiveId: (activeId) => set({ activeId }),
}))
