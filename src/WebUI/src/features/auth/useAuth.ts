import { useEffect } from "react"
import type { User } from "oidc-client-ts"
import { useAuthStore, type AuthUser, type UserRole } from "@/stores/auth"
import { userManager } from "./oidc"

function toAuthUser(user: User): AuthUser {
  const profile = user.profile
  const roleClaim = profile.role as string | string[] | undefined
  const isStaff = Array.isArray(roleClaim) ? roleClaim.includes("staff") : roleClaim === "staff"
  const role: UserRole = isStaff ? "staff" : "customer"
  const name = (profile.name as string | undefined) ?? profile.preferred_username ?? "User"
  return { id: profile.sub, name, role }
}

/** Mirror the oidc-client-ts session into the auth store. Call once, high in the tree. */
export function useAuthSync() {
  const setUser = useAuthStore((s) => s.setUser)
  const setReady = useAuthStore((s) => s.setReady)

  useEffect(() => {
    let active = true
    void userManager.getUser().then((user) => {
      if (!active) return
      setUser(user && !user.expired ? toAuthUser(user) : null)
      setReady(true)
    })

    const onLoaded = (user: User) => setUser(toAuthUser(user))
    const onCleared = () => setUser(null)
    userManager.events.addUserLoaded(onLoaded)
    userManager.events.addUserUnloaded(onCleared)
    userManager.events.addAccessTokenExpired(onCleared)

    return () => {
      active = false
      userManager.events.removeUserLoaded(onLoaded)
      userManager.events.removeUserUnloaded(onCleared)
      userManager.events.removeAccessTokenExpired(onCleared)
    }
  }, [setUser, setReady])
}

/** Redirect to IdentityServer to sign in, remembering where to return afterwards. */
export function signIn(returnTo?: string) {
  return userManager.signinRedirect({ state: { returnTo: returnTo ?? window.location.pathname } })
}

/** Redirect to IdentityServer to end the session. */
export function signOut() {
  return userManager.signoutRedirect()
}
