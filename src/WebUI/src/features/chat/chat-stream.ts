import type { ContentBlock } from "./types"
import { ServerBlockSchema } from "./schemas"

// SSE reader for the Backend's `POST /api/chat` (design section C5 / D). The endpoint streams
// `event:`/`data:` frames — `token` (answer delta), `search` (transient affordance), `block` (typed
// product/citation/category payload), `done`, and `error`. We use fetch + ReadableStream (not
// EventSource, which can't POST or send auth headers) with an AbortController for Stop.

export type ChatStreamEvent =
  | { type: "token"; text: string }
  | { type: "search"; phrase: string }
  | { type: "block"; block: Exclude<ContentBlock, { kind: "searching" }> }
  | { type: "done"; conversationId: string; messageId: string; title: string }
  | { type: "error"; message: string }

export interface ChatStreamRequest {
  conversationId: number | null
  message: string
}

interface StreamOptions {
  token?: string
  signal?: AbortSignal
  onEvent: (event: ChatStreamEvent) => void
}

export async function streamChat(
  request: ChatStreamRequest,
  { token, signal, onEvent }: StreamOptions
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames are separated by a blank line.
    let sep: number
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const event = parseFrame(frame)
      if (event) onEvent(event)
    }
  }
}

function parseFrame(frame: string): ChatStreamEvent | null {
  let name = "message"
  const dataLines: string[] = []
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim()
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return null

  const payload = JSON.parse(dataLines.join("\n"))
  switch (name) {
    case "token":
      return { type: "token", text: String(payload.text ?? "") }
    case "search":
      return { type: "search", phrase: String(payload.phrase ?? "") }
    case "block":
      return { type: "block", block: ServerBlockSchema.parse(payload) }
    case "done":
      return {
        type: "done",
        conversationId: String(payload.conversationId),
        messageId: String(payload.messageId),
        title: String(payload.title ?? ""),
      }
    case "error":
      return { type: "error", message: String(payload.message ?? "Something went wrong") }
    default:
      return null
  }
}
