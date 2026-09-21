import { NavLink, Outlet } from "react-router-dom"
import { LayoutGrid, LogOut, MessagesSquare, Package, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatDock } from "@/components/chat/ChatDock"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/auth"
import { signIn, signOut } from "@/features/auth/useAuth"

const navItems = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/products", label: "Catalog", icon: Package },
  { to: "/account/tickets", label: "My tickets", icon: Ticket },
  { to: "/chat", label: "Chat", icon: MessagesSquare },
]

/**
 * App shell (design Section A): header + left sidebar + routed content, with the chatbot mounted
 * once here as a persistent dock so it survives navigation.
 */
export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            A
          </span>
          Arche's Shop
        </div>
        <AccountMenu />
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r bg-card p-3 sm:block">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <ChatDock />
    </div>
  )
}

function AccountMenu() {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return (
      <Button size="sm" variant="outline" onClick={() => void signIn()}>
        Sign in
      </Button>
    )
  }

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-secondary/60">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {user.name}
          <div className="text-xs font-normal capitalize text-muted-foreground">{user.role}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
