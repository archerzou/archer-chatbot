import { z } from "zod"

// The Backend serializes these enums as integers (see docs/postman/API.md). These schemas coerce
// them to readable string literals so the UI never deals with magic numbers.
export const TicketStatus = z.enum(["Open", "Closed"])
export type TicketStatus = z.infer<typeof TicketStatus>

export const TicketType = z.enum(["Question", "Idea", "Complaint", "Returns"])
export type TicketType = z.infer<typeof TicketType>

const STATUS_BY_INT: Record<number, TicketStatus> = { 0: "Open", 1: "Closed" }
const TYPE_BY_INT: Record<number, TicketType> = {
  0: "Question",
  1: "Idea",
  2: "Complaint",
  3: "Returns",
}

export const ticketStatusFromInt = z
  .number()
  .int()
  .transform((n, ctx) => {
    const value = STATUS_BY_INT[n]
    if (!value) ctx.addIssue({ code: "custom", message: `Unknown TicketStatus: ${n}` })
    return value
  })

export const ticketTypeFromInt = z
  .number()
  .int()
  .transform((n, ctx) => {
    const value = TYPE_BY_INT[n]
    if (!value) ctx.addIssue({ code: "custom", message: `Unknown TicketType: ${n}` })
    return value
  })
