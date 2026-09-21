import type { CategoryItem } from "../types"

interface CategoryChipsProps {
  categories: CategoryItem[]
  /** Clicking a chip re-queries the assistant for that category (design section B3). */
  onPrompt?: (text: string) => void
}

/** Category suggestions rendered as chips that re-query on click. */
export function CategoryChips({ categories, onPrompt }: CategoryChipsProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {categories.map((category) => (
        <button
          key={category.categoryId}
          type="button"
          disabled={!onPrompt}
          onClick={() => onPrompt?.(`Show me ${category.name} products`)}
          className="rounded-full border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-default disabled:hover:bg-background"
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
