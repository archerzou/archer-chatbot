import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground">
          Storefront shell for the Archer chatbot. Ask the assistant anything using the launcher in
          the bottom-right corner.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Phase 0 scaffolding</CardTitle>
          <CardDescription>
            Routing, providers, auth store, Axios client and the chat dock are wired up. Catalog,
            tickets and the full chat experience land in later phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          See <code>docs/context/frontend-design.md</code> for the full plan.
        </CardContent>
      </Card>
    </div>
  )
}
