import { useEffect, useRef, useState } from "react"
import { Send, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MAX_MESSAGE_LENGTH } from "../constants"

interface ComposerProps {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function Composer({ onSend, onStop, isStreaming, disabled }: ComposerProps) {
  const [value, setValue] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)

  const trimmed = value.trim()
  const tooLong = value.length > MAX_MESSAGE_LENGTH
  const canSend = trimmed.length > 0 && !tooLong && !disabled && !isStreaming

  // Auto-grow the textarea up to a cap.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  function submit() {
    if (!canSend) return
    onSend(trimmed)
    setValue("")
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2">
        <Textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter your message"
          className="max-h-40 min-h-[40px] resize-none"
          aria-label="Message"
        />
        {isStreaming ? (
          <Button size="icon" variant="secondary" onClick={onStop} aria-label="Stop generating">
            <Square />
          </Button>
        ) : (
          <Button size="icon" onClick={submit} disabled={!canSend} aria-label="Send message">
            <Send />
          </Button>
        )}
      </div>
      {tooLong && (
        <p className={cn("mt-1 text-right text-xs text-destructive")}>
          {value.length} / {MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  )
}
