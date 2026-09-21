/** Three-dot "assistant is typing" animation (matches the reference mock). */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s] motion-reduce:animate-none" />
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s] motion-reduce:animate-none" />
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none" />
    </div>
  )
}
