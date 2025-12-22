"use client"

import { Badge } from "@/components/ui/badge"
import type {
  InvoiceListItem,
  InvoiceStatus,
  PersonSummary,
} from "@/components/invoices/invoices-types"
import { formatCurrency } from "@/components/invoices/invoices-utils"

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "border-muted-foreground/30 bg-muted/30 text-muted-foreground",
  issued: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  paid: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  canceled: "border-rose-500/40 bg-rose-500/10 text-rose-200",
}

type InvoicesTableProps = {
  invoices: InvoiceListItem[]
  people: PersonSummary[]
  onSelect: (invoice: InvoiceListItem) => void
}

export function InvoicesTable({ invoices, people, onSelect }: InvoicesTableProps) {
  const personMap = new Map(people.map((person) => [person.id, person]))

  return (
    <div className="px-4 pb-4">
      <div className="hidden grid-cols-[1.4fr_1.2fr_0.9fr_0.7fr_0.8fr] gap-3 border-b py-3 text-xs uppercase tracking-wide text-muted-foreground md:grid">
        <div>Invoice</div>
        <div>Customer</div>
        <div>Due</div>
        <div>Status</div>
        <div className="text-right">Total</div>
      </div>
      <div className="mt-3 space-y-2">
        {invoices.length ? (
          invoices.map((invoice) => {
            const person = personMap.get(invoice.person_id)
            const dueDate = new Date(invoice.due_date)
            const isOverdue =
              dueDate < new Date() &&
              invoice.status !== "paid" &&
              invoice.status !== "canceled"
            return (
              <button
                key={invoice.id}
                type="button"
                className="w-full rounded-2xl border bg-background/60 p-4 text-left transition hover:bg-muted/40"
                onClick={() => onSelect(invoice)}
              >
                <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1.2fr_0.9fr_0.7fr_0.8fr] md:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground md:hidden">
                      Invoice
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {invoice.number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued{" "}
                      {new Date(invoice.issue_date).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground md:hidden">
                      Customer
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {person?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {person?.email ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground md:hidden">
                      Due
                    </p>
                    <p className="text-sm text-foreground">
                      {dueDate.toLocaleDateString("en-GB")}
                    </p>
                    {isOverdue && (
                      <p className="text-xs text-rose-300">Overdue</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground md:hidden">
                      Status
                    </p>
                    <Badge
                      variant="outline"
                      className={`rounded-full border px-3 py-1 text-xs capitalize ${statusStyles[invoice.status]}`}
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground md:hidden">
                      Total
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No invoices yet.
          </div>
        )}
      </div>
    </div>
  )
}
