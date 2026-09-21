import { create } from "zustand"

export type UserRole = "customer" | "staff"

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

interface AuthState {
  /** Current user, mirrored from oidc-client-ts. Null when signed out. */
  user: AuthUser | null
  /** True once the initial OIDC session check has completed (avoids redirect flashes). */
  ready: boolean
  setUser: (user: AuthUser | null) => void
  setReady: (ready: boolean) => void
}

// oidc-client-ts owns the tokens/session; this store is just a UI-facing mirror kept in sync by
// useAuthSync (features/auth/useAuth.ts).
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
}))
