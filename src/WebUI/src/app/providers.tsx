import type { ReactNode } from "react"
import { BrowserRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/app/query-client"
import { useAuthSync } from "@/features/auth/useAuth"

/** Keeps the auth store in sync with the OIDC session for the lifetime of the app. */
function AuthGate({ children }: { children: ReactNode }) {
  useAuthSync()
  return <>{children}</>
}

/** App-wide providers: TanStack Query, router, auth sync, and the Sonner toast host. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGate>{children}</AuthGate>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
