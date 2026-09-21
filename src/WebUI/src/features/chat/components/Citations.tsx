import { BookOpen } from "lucide-react"
import type { CiteRef } from "../cite"

/** Footer chips for the manual references cited in an assistant answer (design section B3). */
export function Citations({ refs }: { refs: CiteRef[] }) {
  if (refs.length === 0) return null

  return (
    <div className="mt-2 flex flex-col gap-1 border-t pt-2">
      {refs.map((ref) => (
        <div
          key={ref.searchResultId}
          className="flex items-start gap-1.5 text-xs text-muted-foreground"
        >
          <BookOpen className="mt-0.5 size-3 shrink-0" />
          <span>
            <span className="font-medium">[{ref.index}]</span> From the manual
            {ref.page != null && ` (p.${ref.page})`}
            {ref.quote && (
              <>
                {" — "}
                <span className="italic">&ldquo;{ref.quote}&rdquo;</span>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
