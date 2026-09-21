import { Navigate, Route, Routes } from "react-router-dom"
import { RootLayout } from "@/components/layout/RootLayout"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { CallbackPage } from "@/features/auth/CallbackPage"
import { HomePage } from "@/pages/HomePage"
import { LoginPage } from "@/pages/LoginPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { ChatPage } from "@/features/chat/ChatPage"

/**
 * Route map from docs/context/frontend-design.md (Section A). Everything renders inside RootLayout
 * so the chatbot dock persists across navigation. Non-public routes are wrapped in ProtectedRoute;
 * pages other than Home/Login are Phase 0 placeholders.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<PlaceholderPage title="Catalog" />} />
        <Route path="/products/:productId" element={<PlaceholderPage title="Product detail" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />

        {/* Authenticated (customer) */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Account" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/tickets"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="My tickets" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/tickets/:id"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Ticket detail" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
