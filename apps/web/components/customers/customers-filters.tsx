import type { Column } from "@/components/customers/customers-types"
import { cn } from "@/lib/utils"

type CustomersFiltersProps = {
  columns: Column[]
  visibleColumnIds: string[]
  onToggleColumn: (columnId: string) => void
}

export function CustomersFilters({
  columns,
  visibleColumnIds,
  onToggleColumn,
}: CustomersFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 text-xs text-muted-foreground">
      <span className="text-[11px] uppercase tracking-wide">Filter</span>
      {columns.map((column) => {
        const isActive = visibleColumnIds.includes(column.id)

        return (
          <button
            key={column.id}
            type="button"
            onClick={() => onToggleColumn(column.id)}
            aria-pressed={isActive}
            className={cn(
              "rounded-full border px-2 py-1 text-xs transition",
              isActive
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {column.label}
          </button>
        )
      })}
    </div>
  )
}
