import { UserManager, WebStorageStateStore } from "oidc-client-ts"

// OIDC authorization-code + PKCE against IdentityServer's hosted login/register pages.
// The SPA never sees credentials; IdentityServer redirects back to /auth/callback with a code
// that oidc-client-ts exchanges for tokens the Backend already trusts (design section E4).
const authority = import.meta.env.VITE_OIDC_AUTHORITY ?? "https://localhost:7275"

export const userManager = new UserManager({
  authority,
  client_id: "webui",
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: "code",
  scope: "openid profile role staff-api offline_access",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})
