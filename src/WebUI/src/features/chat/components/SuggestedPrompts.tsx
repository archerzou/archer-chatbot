import { Bot } from "lucide-react"
import { SUGGESTED_PROMPTS } from "../constants"

/** Welcome / empty state: greeting plus seed-driven quick-action prompts. */
export function SuggestedPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary">
          <Bot className="size-4" />
        </span>
        <div className="rounded-2xl bg-secondary px-3.5 py-2 text-sm text-secondary-foreground">
          Hi! I'm the Arche's Shop assistant. Ask me about our products, how to use them, or anything
          else.
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Try asking</p>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
