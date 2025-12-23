"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { IncomeTransaction, PersonSummary } from "@/components/income/transactions-types"
import { formatAmount } from "@/components/income/transactions-utils"

const sourceLabels: Record<string, string> = {
  bank_transfer: "Bank transfer",
  payroll: "Payroll",
  cash: "Cash",
  manual: "Manual",
}

type TransactionsTableProps = {
  transactions: IncomeTransaction[]
  people: PersonSummary[]
  onSelect: (transaction: IncomeTransaction) => void
}

export function TransactionsTable({
  transactions,
  people,
  onSelect,
}: TransactionsTableProps) {
  const personMap = new Map(people.map((person) => [person.id, person]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Date</th>
            <th className="px-4 py-3 text-left font-medium">Customer</th>
            <th className="px-4 py-3 text-left font-medium">Reference</th>
            <th className="px-4 py-3 text-left font-medium">Source</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length ? (
            transactions.map((transaction) => {
              const person = personMap.get(transaction.person_id)
              const amountLabel = formatAmount(transaction.amount, transaction.currency)

              return (
                <tr
                  key={transaction.id}
                  className="border-b last:border-b-0 transition hover:bg-muted/40"
                  onClick={() => onSelect(transaction)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onSelect(transaction)
                    }
                  }}
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(transaction.received_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {person?.name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {person?.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {transaction.reference ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {sourceLabels[transaction.source_type]}
                      </Badge>
                      {transaction.status === "planned" && (
                        <Badge variant="secondary">Planned</Badge>
                      )}
                      {transaction.is_reconciled && (
                        <Badge variant="secondary">Reconciled</Badge>
                      )}
                    </div>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium",
                      transaction.status === "planned"
                        ? "text-muted-foreground"
                        : transaction.is_reconciled
                          ? "text-foreground"
                          : "text-emerald-500"
                    )}
                  >
                    {amountLabel}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                No income transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
