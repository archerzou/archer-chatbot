/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** IdentityServer authority URL (OIDC). Defaults to the standalone dev port. */
  readonly VITE_OIDC_AUTHORITY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
