import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { userManager } from "./oidc"

/** Handles the OIDC redirect back from IdentityServer, then routes to the original destination. */
export function CallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return // guard against StrictMode double-invoke (code is single-use)
    handled.current = true
    userManager
      .signinRedirectCallback()
      .then((user) => {
        const returnTo = (user.state as { returnTo?: string } | undefined)?.returnTo
        navigate(returnTo && returnTo !== "/login" ? returnTo : "/", { replace: true })
      })
      .catch(() => navigate("/", { replace: true }))
  }, [navigate])

  return <div className="p-6 text-sm text-muted-foreground">Signing you in…</div>
}
