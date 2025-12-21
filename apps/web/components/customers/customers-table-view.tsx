import type { Column, Customer, LoadState } from "@/components/customers/customers-types"
import { cn } from "@/lib/utils"

type CustomersTableViewProps = {
  customers: Customer[]
  visibleColumns: Column[]
  loadState: LoadState
  onRowClick: (customer: Customer) => void
}

export function CustomersTableView({
  customers,
  visibleColumns,
  loadState,
  onRowClick,
}: CustomersTableViewProps) {
  const hasCustomers = customers.length > 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {visibleColumns.map((column) => (
              <th key={column.id} className="px-4 py-3 text-left font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasCustomers ? (
            customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-b last:border-b-0 transition hover:bg-muted/40"
                onClick={() => onRowClick(customer)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onRowClick(customer)
                  }
                }}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-4 py-3 text-muted-foreground",
                      column.cellClassName
                    )}
                  >
                    {column.render(customer)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-4 py-6 text-sm text-muted-foreground"
                colSpan={Math.max(visibleColumns.length, 1)}
              >
                {loadState.status === "loading"
                  ? "Loading customers…"
                  : loadState.status === "error"
                    ? loadState.message
                    : "No customers yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
