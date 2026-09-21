# Archer Chatbot — WebUI

React 19 + Vite + TypeScript frontend for the Archer chatbot, implementing **Phase 1** of
[`docs/context/frontend-design.md`](../../docs/context/frontend-design.md): OIDC auth, and a
client-orchestrated chatbot MVP (streaming replies, client-side conversation history).

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · React Router v7 ·
TanStack Query · Zustand (persisted) · Zod · Axios · Sonner · oidc-client-ts · react-markdown.

## Getting started

```powershell
npm install
copy .env.example .env   # adjust ports if needed
npm run dev              # http://localhost:5173
```

Requires the Backend + IdentityServer running (via `dotnet run --project src/AppHost`, or
standalone). The dev server proxies Backend calls (`/api`, `/tickets`, `/customer`, `/manual`);
OIDC traffic goes **directly** to `VITE_OIDC_AUTHORITY` (trust the dev HTTPS cert). Set
`VITE_API_TARGET` / `VITE_OIDC_AUTHORITY` in `.env` to match your services.

## Auth

Authentication is OIDC **authorization-code + PKCE** against IdentityServer's own hosted
login/register pages (public `webui` client). There are no in-app credential forms — "Sign in"
redirects to IdentityServer and back to `/auth/callback`. Seeded users: **alice/alice** (customer),
**bob/bob** (staff).

> The only AI endpoint (`/api/assistant/chat`) is **staff-gated**, so live streaming currently
> requires signing in as **bob**. A customer-facing chat endpoint is a later backend gap
> (design section D).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview the production build |

## Structure

```
src/
├─ app/          # providers (incl. auth sync), router, query client
├─ components/
│  ├─ ui/        # shadcn/ui primitives
│  ├─ layout/    # RootLayout (header + account menu + sidebar + chat dock slot)
│  └─ chat/      # ChatDock (launcher / dock host)
├─ features/
│  ├─ auth/      # oidc UserManager, useAuth, ProtectedRoute, CallbackPage
│  └─ chat/      # store, streaming, send hook, components, ChatPage
├─ lib/          # axios instance (OIDC-aware), utils, error helper
├─ stores/       # auth mirror + ui (Zustand)
├─ schemas/      # Zod base schemas (used from Phase 2)
└─ pages/        # route-level pages (Home, Login redirect, placeholders)
```
