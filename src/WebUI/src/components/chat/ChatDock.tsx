import { useEffect, useRef } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUiStore } from "@/stores/ui"
import { ChatWindow } from "@/features/chat/components/ChatWindow"
import { useFocusTrap } from "@/features/chat/useFocusTrap"

/**
 * Persistent chat slot (design Section B): a floating launcher when closed, a compact pill when
 * minimized, and a right-docked panel (full-screen on mobile) when open. Panel state lives in the
 * (persisted) UI store so it survives navigation and reloads. When open the panel traps focus and
 * closes on Escape; focus returns to the launcher afterwards (section B7).
 */
export function ChatDock() {
  const chatPanel = useUiStore((s) => s.chatPanel)
  const openChat = useUiStore((s) => s.openChat)
  const minimizeChat = useUiStore((s) => s.minimizeChat)
  const closeChat = useUiStore((s) => s.closeChat)

  const panelRef = useFocusTrap<HTMLElement>(chatPanel === "open")
  const launcherRef = useRef<HTMLButtonElement>(null)
  // Return focus to the launcher once the panel leaves the open state.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (chatPanel === "open") {
      wasOpen.current = true
    } else if (wasOpen.current) {
      wasOpen.current = false
      launcherRef.current?.focus()
    }
  }, [chatPanel])

  if (chatPanel === "closed") {
    return (
      <Button
        ref={launcherRef}
        size="icon"
        onClick={openChat}
        aria-label="Open chat"
        className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
      >
        <Bot className="size-6" />
      </Button>
    )
  }

  if (chatPanel === "minimized") {
    return (
      <button
        ref={launcherRef}
        type="button"
        onClick={openChat}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg"
      >
        <Bot className="size-5" />
        AI Chatbot
      </button>
    )
  }

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      aria-label="AI Chatbot"
      onKeyDown={(e) => {
        if (e.key === "Escape") closeChat()
      }}
      className="fixed inset-0 flex h-full w-full flex-col overflow-hidden border-0 bg-card shadow-2xl outline-none sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[46rem] sm:max-h-[calc(100vh-3rem)] sm:w-[32rem] sm:max-w-[calc(100vw-3rem)] sm:rounded-xl sm:border"
    >
      <ChatWindow variant="dock" onMinimize={minimizeChat} onClose={closeChat} />
    </section>
  )
}
