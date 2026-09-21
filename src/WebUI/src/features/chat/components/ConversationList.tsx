import { useState } from "react"
import { Check, Pencil, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatSession } from "../store"
import {
  useConversations,
  useDeleteConversation,
  useRenameConversation,
} from "../useConversations"

/** Past-conversations panel: select, rename (inline), and delete. Server-backed (design C3). */
export function ConversationList({ onPick }: { onPick: () => void }) {
  const { data: conversations = [], isLoading } = useConversations()
  const activeId = useChatSession((s) => s.activeId)
  const setActiveId = useChatSession((s) => s.setActiveId)
  const rename = useRenameConversation()
  const remove = useDeleteConversation()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  function startEdit(id: string, title: string) {
    setEditingId(id)
    setDraft(title)
  }

  function commitEdit() {
    if (editingId) rename.mutate({ id: editingId, title: draft })
    setEditingId(null)
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>
  }

  if (conversations.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {conversations.map((conversation) => {
        const isEditing = editingId === conversation.id
        return (
          <div
            key={conversation.id}
            className={cn(
              "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
              conversation.id === activeId ? "bg-secondary" : "hover:bg-secondary/60"
            )}
          >
            {isEditing ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  className="min-w-0 flex-1 rounded border bg-background px-1.5 py-0.5 text-sm"
                />
                <button type="button" onClick={commitEdit} aria-label="Save name" className="p-1">
                  <Check className="size-4" />
                </button>
                <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel" className="p-1">
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(conversation.id)
                    onPick()
                  }}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {conversation.title}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(conversation.id, conversation.title)}
                  aria-label="Rename conversation"
                  className="p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(conversation.id)}
                  aria-label="Delete conversation"
                  className="p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
