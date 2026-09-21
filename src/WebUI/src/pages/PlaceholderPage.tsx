import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** Reusable stand-in for routes whose real UI is built in a later phase. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is a Phase 0 placeholder.
        </CardContent>
      </Card>
    </div>
  )
}
