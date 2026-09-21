import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Search } from "lucide-react"
import type { ChatMessage, SearchingBlock } from "../types"
import { messageCategories, messageCitations, messageProducts, messageText } from "../types"
import { parseAnswer } from "../cite"
import { Citations } from "./Citations"
import { ProductCard } from "./ProductCard"
import { ResultTable } from "./ResultTable"
import { CategoryChips } from "./CategoryChips"

interface MessageContentProps {
  message: ChatMessage
  onPrompt?: (text: string) => void
}

/**
 * Renders a message's content blocks (design section B3). User text is plain (whitespace
 * preserved). Assistant messages render sanitized GitHub-flavored markdown (with inline `<cite>`
 * markup lifted into numbered chips), a transient "Searching…" affordance, structured
 * product/category cards, and a manual-citations footer.
 */
export function MessageContent({ message, onPrompt }: MessageContentProps) {
  const text = messageText(message)

  if (message.role === "user") {
    return <span className="whitespace-pre-wrap break-words">{text}</span>
  }

  const { markdown, refs } = parseAnswer(text, messageCitations(message))
  const searching = message.blocks.find((b): b is SearchingBlock => b.kind === "searching")
  const products = messageProducts(message)
  const categories = messageCategories(message)

  return (
    <div>
      {markdown && (
        <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:my-1.5 prose-pre:my-2 prose-ul:my-1.5 prose-ol:my-1.5">
          <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
        </div>
      )}
      {searching && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Search className="size-3 animate-pulse motion-reduce:animate-none" />
          Searching {searching.phrase}…
        </div>
      )}
      {products.length > 0 && (
        <div className="mt-2">
          {products.length === 1 ? (
            <ProductCard product={products[0]} />
          ) : (
            <ResultTable products={products} />
          )}
        </div>
      )}
      {categories.length > 0 && <CategoryChips categories={categories} onPrompt={onPrompt} />}
      <Citations refs={refs} />
    </div>
  )
}
