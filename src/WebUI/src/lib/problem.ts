import { AxiosError } from "axios"

/** RFC 7807 ProblemDetails, as returned by ASP.NET Core minimal APIs. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  traceId?: string
  errors?: Record<string, string[]>
}

/** Turn any error (Axios/ProblemDetails/string) into a human-readable message. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ProblemDetails | string | undefined
    if (typeof data === "string" && data.trim()) return data
    if (data && typeof data === "object") {
      if (data.errors) {
        const first = Object.values(data.errors)[0]
        if (first?.length) return first[0]
      }
      return data.detail || data.title || error.message || fallback
    }
    if (error.code === "ERR_NETWORK") return "Cannot reach the server. Is the Backend running?"
    return error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
