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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  PersonSummary,
} from "@/components/income/transactions-types"

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
  isSaving,
  isDeleting,
  isSaveDisabled,
  onOpenChange,
  onFormChange,
  onSave,
  onDelete,
}: TransactionDrawerProps) {
  const personOptions = useMemo(
    () => people.map((person) => ({
      value: person.id,
      label: person.email ? `${person.name} · ${person.email}` : person.name,
    })),
    [people]
  )

  const isEdit = mode === "edit"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "New income" : "Edit income"}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form
            className="flex flex-col gap-4"
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
                    onFormChange({ ...formState, person_id: value })
                  }
                  disabled={isEdit}
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
                    step="1"
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
                    placeholder="EUR"
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
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Amount, currency, source, and customer are immutable in v1.
                </p>
              )}
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
            </div>
          </form>
        </div>
        <SheetFooter className="border-t">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex gap-2 sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={isSaveDisabled}>
                {isSaving ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
