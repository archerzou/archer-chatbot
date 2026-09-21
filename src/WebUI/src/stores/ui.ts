import { create } from "zustand"
import { persist } from "zustand/middleware"

/** Chat panel presentation state (design C3). Persisted so it survives reloads/navigation. */
export type ChatPanelState = "closed" | "open" | "minimized"

interface UiState {
  chatPanel: ChatPanelState
  openChat: () => void
  minimizeChat: () => void
  closeChat: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      chatPanel: "closed",
      openChat: () => set({ chatPanel: "open" }),
      minimizeChat: () => set({ chatPanel: "minimized" }),
      closeChat: () => set({ chatPanel: "closed" }),
    }),
    { name: "archer-chatbot-ui" }
  )
)
