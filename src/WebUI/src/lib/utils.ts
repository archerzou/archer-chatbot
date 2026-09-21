import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const priceFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

/** Formats a catalog price (e.g. 199.99 → "$199.99"). */
export function formatPrice(price: number) {
  return priceFormatter.format(price)
}

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })

/** Formats a message timestamp (epoch ms) as a short local time, e.g. "08:15 AM". */
export function formatTime(epochMs: number) {
  return timeFormatter.format(epochMs)
}
