import { useState } from "react"
import { Bot, History, Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"
import { signIn } from "@/features/auth/useAuth"
import { useChatSession } from "../store"
import { useConversation } from "../useConversations"
import { useSendMessage } from "../useSendMessage"
import { MessageList } from "./MessageList"
import { SuggestedPrompts } from "./SuggestedPrompts"
import { Composer } from "./Composer"
import { ConversationList } from "./ConversationList"

interface ChatWindowProps {
  /** `dock` shows minimize/close controls; `page` is the full-page variant. */
  variant: "dock" | "page"
  onMinimize?: () => void
  onClose?: () => void
}

export function ChatWindow({ variant, onMinimize, onClose }: ChatWindowProps) {
  const user = useAuthStore((s) => s.user)
  const activeId = useChatSession((s) => s.activeId)
  const setActiveId = useChatSession((s) => s.setActiveId)
  const { data: conversation } = useConversation(activeId)
  const { send, stop, isStreaming } = useSendMessage()

  const [view, setView] = useState<"chat" | "history">("chat")
  const messages = conversation?.messages ?? []

  const handleSend = (text: string) => void send(text)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2 font-medium">
          <Bot className="size-5" />
          AI Chatbot
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView((v) => (v === "history" ? "chat" : "history"))}
            aria-label="Conversation history"
            className="rounded p-1 hover:bg-white/10"
          >
            <History className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveId(null)
              setView("chat")
            }}
            aria-label="New chat"
            className="rounded p-1 hover:bg-white/10"
          >
            <Plus className="size-4" />
          </button>
          {variant === "dock" && (
            <>
              <button type="button" onClick={onMinimize} aria-label="Minimize chat" className="rounded p-1 hover:bg-white/10">
                <Minus className="size-4" />
              </button>
              <button type="button" onClick={onClose} aria-label="Close chat" className="rounded p-1 hover:bg-white/10">
                <X className="size-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {view === "history" ? (
        <ConversationList onPick={() => setView("chat")} />
      ) : !user ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Bot className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Sign in to chat with the assistant.</p>
          <Button size="sm" onClick={() => void signIn()}>
            Sign in
          </Button>
        </div>
      ) : !activeId || messages.length === 0 ? (
        <SuggestedPrompts onPick={handleSend} />
      ) : (
        <MessageList messages={messages} onPrompt={handleSend} />
      )}

      {view === "chat" && user && (
        <Composer onSend={handleSend} onStop={stop} isStreaming={isStreaming} />
      )}
    </div>
  )
}
