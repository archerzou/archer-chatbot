import { Bot } from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import type { ChatMessage } from "../types"
import { messageText } from "../types"
import { MessageContent } from "./MessageContent"
import { TypingIndicator } from "./TypingIndicator"

export function MessageBubble({
  message,
  onPrompt,
}: {
  message: ChatMessage
  onPrompt?: (text: string) => void
}) {
  const isUser = message.role === "user"
  // Show the typing dots only until there's something to render — text, a search affordance, or a
  // citation. Otherwise the "Searching…" state would never surface (it precedes any answer text).
  const hasContent =
    messageText(message).length > 0 ||
    message.blocks.some((b) => b.kind === "searching" || b.kind === "citations")
  const isEmptyStreaming = message.status === "streaming" && !hasContent

  return (
    <div className={cn("flex items-start gap-2", isUser ? "justify-end" : "justify-start")}>
      {/* Assistant avatar (left) indicates who the message belongs to. */}
      {!isUser && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Bot className="size-4" />
        </span>
      )}
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
            message.status === "error" && "bg-destructive/10 text-destructive"
          )}
        >
          {isEmptyStreaming ? <TypingIndicator /> : <MessageContent message={message} onPrompt={onPrompt} />}
          {message.status === "error" && (
            <span className="mt-1 block text-xs">Something went wrong. Please try again.</span>
          )}
        </div>
        {!isEmptyStreaming && (
          <time className="px-1 text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</time>
        )}
      </div>
    </div>
  )
}
