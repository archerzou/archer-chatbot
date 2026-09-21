import { ChatWindow } from "./components/ChatWindow"

/** Full-page chat (mobile fallback / deep link), reusing the same ChatWindow tree. */
export function ChatPage() {
  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl overflow-hidden rounded-xl border bg-card shadow-sm">
      <ChatWindow variant="page" />
    </div>
  )
}
