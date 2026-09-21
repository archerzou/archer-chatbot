import { useEffect, useRef } from "react"
import type { ChatMessage } from "../types"
import { MessageBubble } from "./MessageBubble"

interface MessageListProps {
  messages: ChatMessage[]
  onPrompt?: (text: string) => void
}

export function MessageList({ messages, onPrompt }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll as messages arrive / stream.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages])

  return (
    <div
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onPrompt={onPrompt} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
