import type { Citation } from "./types"

// The assistant embeds citations inline as `<cite searchResultId=N>short quote</cite>`
// (Backend AssistantApi.cs). We lift those out of the markdown, number them in order of first
// appearance, and join each to the product/page carried by the matching SearchResult stream item.

export interface CiteRef {
  index: number // 1-based display number
  searchResultId: number
  quote: string
  productId: number | null
  page: number | null
}

export interface ParsedAnswer {
  markdown: string
  refs: CiteRef[]
}

const CITE_RE = /<cite\s+searchResultId=(\d+)\s*>([\s\S]*?)<\/cite>/gi
// A cite tag that has opened but not yet closed — happens while the answer is still streaming in.
const PARTIAL_CITE_RE = /<cite\b[^>]*>?[^<]*$/i

export function parseAnswer(text: string, citations: Citation[]): ParsedAnswer {
  const order: number[] = []
  const quotes = new Map<number, string>()

  let markdown = text.replace(CITE_RE, (_match, idRaw: string, quote: string) => {
    const id = Number(idRaw)
    if (!order.includes(id)) order.push(id)
    const trimmed = quote.trim()
    if (trimmed) quotes.set(id, trimmed)
    return `${trimmed} [${order.indexOf(id) + 1}]`
  })

  // Don't flash a half-written `<cite …>` tag mid-stream.
  markdown = markdown.replace(PARTIAL_CITE_RE, "").trimEnd()

  const byId = new Map(citations.map((c) => [c.searchResultId, c]))
  const refs: CiteRef[] = order.map((id, i) => ({
    index: i + 1,
    searchResultId: id,
    quote: quotes.get(id) ?? "",
    productId: byId.get(id)?.productId ?? null,
    page: byId.get(id)?.page ?? null,
  }))

  return { markdown, refs }
}
