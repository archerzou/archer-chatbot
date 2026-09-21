import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { signIn } from "@/features/auth/useAuth"

/** No in-app form — immediately redirect to IdentityServer's hosted login/register pages. */
export function LoginPage() {
  const location = useLocation()

  useEffect(() => {
    const returnTo = (location.state as { returnTo?: string } | null)?.returnTo
    void signIn(returnTo)
  }, [location.state])

  return <div className="p-6 text-sm text-muted-foreground">Redirecting to sign in…</div>
}
