"use client"

import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type {
  FormState,
  IncomeSourceType,
  InvoiceSummary,
  PersonSummary,
} from "@/components/income/transactions-types"
import { formatAmount } from "@/components/income/transactions-utils"

const sourceOptions: Array<{ value: IncomeSourceType; label: string }> = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "payroll", label: "Payroll" },
  { value: "cash", label: "Cash" },
  { value: "manual", label: "Manual" },
]

type TransactionDrawerProps = {
  open: boolean
  mode: "create" | "edit"
  formState: FormState
  people: PersonSummary[]
  invoices: InvoiceSummary[]
  isSaving: boolean
  isDeleting: boolean
  isSaveDisabled: boolean
  onOpenChange: (open: boolean) => void
  onFormChange: (next: FormState) => void
  onSave: () => void
  onDelete: () => void
}

export function TransactionDrawer({
  open,
  mode,
  formState,
  people,
  invoices,
  isSaving,
  isDeleting,
  isSaveDisabled,
  onOpenChange,
  onFormChange,
  onSave,
  onDelete,
}: TransactionDrawerProps) {
  const personOptions = useMemo(
    () =>
      people.map((person) => ({
        value: person.id,
        label: person.email ? `${person.name} · ${person.email}` : person.name,
      })),
    [people]
  )

  const isEdit = mode === "edit"
  const invoiceOptions = useMemo(() => {
    const filtered = formState.person_id
      ? invoices.filter((invoice) => invoice.person_id === formState.person_id)
      : invoices
    return filtered.map((invoice) => ({
      value: invoice.id,
      label: `${invoice.number} · ${formatAmount(
        invoice.total,
        invoice.currency
      )}`,
      status: invoice.status,
    }))
  }, [formState.person_id, invoices])
  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === formState.invoice_id),
    [formState.invoice_id, invoices]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(720px,85vh)] w-[min(760px,92vw)] overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">Income</DialogTitle>
        <DialogDescription className="sr-only">
          Create or edit income transactions.
        </DialogDescription>
        <div className="flex h-full flex-col">
          <div className="border-b px-5 py-4">
            <p className="text-sm font-medium">
              {mode === "create" ? "New income" : "Edit income"}
            </p>
            <p className="text-xs text-muted-foreground">
              Track incoming money and references.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form
              className="flex flex-col gap-4 max-w-xl mx-auto"
              onSubmit={(event) => {
                event.preventDefault()
                onSave()
              }}
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="income-person">Customer</Label>
                  <Select
                    value={formState.person_id}
                    onValueChange={(value) =>
                      onFormChange({ ...formState, person_id: value, invoice_id: "" })
                    }
                    disabled={isEdit || !!formState.invoice_id}
                  >
                    <SelectTrigger id="income-person" size="default">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {personOptions.map((person) => (
                        <SelectItem key={person.value} value={person.value}>
                          {person.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="income-invoice">Linked invoice (optional)</Label>
                  <Select
                    value={formState.invoice_id || "none"}
                    onValueChange={(value) =>
                      (() => {
                        if (value === "none") {
                          return onFormChange({ ...formState, invoice_id: "" })
                        }
                        const invoice = invoices.find((item) => item.id === value)
                        if (!invoice) {
                          return onFormChange({ ...formState, invoice_id: value })
                        }
                        onFormChange({
                          ...formState,
                          invoice_id: value,
                          person_id: invoice.person_id,
                          amount:
                            formState.amount && Number(formState.amount) > 0
                              ? formState.amount
                              : invoice.total.toString(),
                          currency: invoice.currency,
                          reference: formState.reference || invoice.number,
                        })
                      })()
                    }
                    disabled={isEdit}
                  >
                    <SelectTrigger id="income-invoice" size="default">
                      <SelectValue placeholder="No invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No invoice</SelectItem>
                      {invoiceOptions.map((invoice) => (
                        <SelectItem key={invoice.value} value={invoice.value}>
                          {invoice.label} · {invoice.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedInvoice && (
                    <p className="text-xs text-muted-foreground">
                      Linked to {selectedInvoice.number}. Customer and currency
                      synced from invoice.
                    </p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="income-amount">Amount (GBP)</Label>
                    <Input
                      id="income-amount"
                      value={formState.amount}
                      onChange={(event) =>
                        onFormChange({ ...formState, amount: event.target.value })
                      }
                      placeholder="0"
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isEdit}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="income-currency">Currency</Label>
                    <Input
                      id="income-currency"
                      value={formState.currency}
                      onChange={(event) =>
                        onFormChange({ ...formState, currency: event.target.value })
                      }
                      placeholder="GBP"
                      disabled={isEdit}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="income-source">Source type</Label>
                    <Select
                      value={formState.source_type}
                      onValueChange={(value) =>
                        onFormChange({
                          ...formState,
                          source_type: value as IncomeSourceType,
                        })
                      }
                      disabled={isEdit}
                    >
                      <SelectTrigger id="income-source" size="default">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="income-date">Received date</Label>
                    <Input
                      id="income-date"
                      type="date"
                      value={formState.received_at}
                      onChange={(event) =>
                        onFormChange({ ...formState, received_at: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="income-reference">Reference</Label>
                  <Input
                    id="income-reference"
                    value={formState.reference}
                    onChange={(event) =>
                      onFormChange({ ...formState, reference: event.target.value })
                    }
                    placeholder="Payroll / bank reference"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="income-tags">Tags</Label>
                  <Input
                    id="income-tags"
                    value={formState.tags}
                    onChange={(event) =>
                      onFormChange({ ...formState, tags: event.target.value })
                    }
                    placeholder="salary, onboarding"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="income-notes">Notes</Label>
                  <Textarea
                    id="income-notes"
                    value={formState.notes}
                    onChange={(event) =>
                      onFormChange({ ...formState, notes: event.target.value })
                    }
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">Reconciled</p>
                    <p className="text-xs text-muted-foreground">
                      Mark when matched against a bank statement.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={formState.is_reconciled ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      onFormChange({
                        ...formState,
                        is_reconciled: !formState.is_reconciled,
                      })
                    }
                  >
                    {formState.is_reconciled ? "Reconciled" : "Mark reconciled"}
                  </Button>
                </div>
                {isEdit && (
                  <p className="text-xs text-muted-foreground">
                    Amount, currency, source, and customer are immutable in v1.
                  </p>
                )}
              </div>
            </form>
          </div>
          <div className="flex items-center justify-between border-t px-5 py-4">
            {mode === "edit" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    Archive
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive income?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will hide the transaction from the list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onDelete}>
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={isSaveDisabled}>
                {isSaving ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
