import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The Backend's ports are assigned by .NET Aspire at runtime; when running the Backend standalone
// (`dotnet run --project src/Backend`) it uses the fixed dev ports below. Override with a .env file.
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:5165'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Fail instead of drifting to another port — the OIDC redirect URI and CORS origin registered
    // on the IdentityServer `webui` client are bound to :5173, so the app must run there.
    strictPort: true,
    proxy: {
      // Backend endpoints. Archer's routes are a mix of `/api/*` and root paths (`/tickets`,
      // `/customer/*`, `/manual`), so each prefix is proxied through to the Backend as-is.
      // (OIDC/IdentityServer traffic goes directly to VITE_OIDC_AUTHORITY, not through this proxy.)
      '/api': { target: apiTarget, changeOrigin: true },
      '/tickets': { target: apiTarget, changeOrigin: true },
      '/customer': { target: apiTarget, changeOrigin: true },
      '/manual': { target: apiTarget, changeOrigin: true },
    },
  },
})
