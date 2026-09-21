import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import type { User } from "oidc-client-ts"
import { userManager } from "@/features/auth/oidc"

// Archer's routes are a mix of `/api/*` and root paths, so the instance uses a relative baseURL
// and callers pass the full path. In dev these are forwarded to the Backend by the Vite proxy.
export const api = axios.create({
  headers: { "Content-Type": "application/json" },
})

// Attach the current OIDC access token to every request.
api.interceptors.request.use(async (config) => {
  const user = await userManager.getUser()
  if (user?.access_token) {
    config.headers.Authorization = `Bearer ${user.access_token}`
  }
  return config
})

// On 401, try a single silent renew and replay; if that fails, redirect to sign in.
let renewing: Promise<User | null> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const user = await (renewing ??= userManager.signinSilent().finally(() => {
          renewing = null
        }))
        if (user?.access_token) {
          original.headers.Authorization = `Bearer ${user.access_token}`
          return api(original)
        }
      } catch {
        // fall through to a full redirect below
      }
      await userManager.signinRedirect({ state: { returnTo: window.location.pathname } })
    }
    return Promise.reject(error)
  }
)
