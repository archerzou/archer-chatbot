import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"

/** Gates a route on authentication. The app does not distinguish staff vs. customer. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const ready = useAuthStore((s) => s.ready)

  if (!ready) return null // wait for the initial OIDC session check
  if (!user) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />
  }
  return <>{children}</>
}
