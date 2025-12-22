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
import { Badge } from "@/components/ui/badge"
import type {
  Invoice,
  InvoiceFormState,
  InvoiceStatus,
  PersonSummary,
} from "@/components/invoices/invoices-types"
import {
  computeLineItems,
  computeTotals,
  formatCurrency,
} from "@/components/invoices/invoices-utils"

const statusOptions: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
  { value: "canceled", label: "Canceled" },
]

type InvoiceDialogProps = {
  open: boolean
  mode: "create" | "edit"
  invoice?: Invoice | null
  formState: InvoiceFormState
  people: PersonSummary[]
  isSaving: boolean
  isDeleting: boolean
  notice?: { tone: "success" | "error"; message: string } | null
  onOpenChange: (open: boolean) => void
  onFormChange: (next: InvoiceFormState) => void
  onSave: () => void
  onDelete: () => void
  onSendEmail: () => void
  onSendReminder: () => void
}

export function InvoiceDialog({
  open,
  mode,
  invoice,
  formState,
  people,
  isSaving,
  isDeleting,
  notice,
  onOpenChange,
  onFormChange,
  onSave,
  onDelete,
  onSendEmail,
  onSendReminder,
}: InvoiceDialogProps) {
  const items = useMemo(() => computeLineItems(formState.items), [formState.items])
  const totals = useMemo(
    () => computeTotals(items, Number(formState.tax_rate) || 0),
    [items, formState.tax_rate]
  )

  const publicLink = useMemo(() => {
    if (typeof window === "undefined" || !invoice?.public_id) {
      return ""
    }
    return `${window.location.origin}/invoice/${invoice.public_id}`
  }, [invoice?.public_id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(80vh,820px)] w-[min(900px,92vw)] overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">Invoice</DialogTitle>
        <DialogDescription className="sr-only">
          Create and edit invoice documents.
        </DialogDescription>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <p className="text-sm font-medium">
                {mode === "create" ? "New invoice" : invoice?.number ?? "Invoice"}
              </p>
              <p className="text-xs text-muted-foreground">
                Document-style editor for billing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{formState.status}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={onSendEmail}
                disabled={mode === "create" || !invoice?.id}
              >
                Send email
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onSendReminder}
                disabled={mode === "create" || !invoice?.id}
              >
                Send reminder
              </Button>
            </div>
          </div>
          {notice && (
            <div className="border-b px-5 py-2">
              <p
                className={`text-xs ${
                  notice.tone === "success" ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {notice.message}
              </p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Invoice</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice?.number ?? "Will be assigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Public</Label>
                    <Button
                      type="button"
                      variant={formState.is_public ? "secondary" : "outline"}
                      size="sm"
                      onClick={() =>
                        onFormChange({
                          ...formState,
                          is_public: !formState.is_public,
                        })
                      }
                    >
                      {formState.is_public ? "Public" : "Private"}
                    </Button>
                  </div>
                </div>
                {formState.is_public && publicLink && (
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {publicLink}
                  </p>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-status">Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) =>
                        onFormChange({
                          ...formState,
                          status: value as InvoiceStatus,
                        })
                      }
                    >
                      <SelectTrigger id="invoice-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-issue">Issue date</Label>
                    <Input
                      id="invoice-issue"
                      type="date"
                      value={formState.issue_date}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          issue_date: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-due">Due date</Label>
                    <Input
                      id="invoice-due"
                      type="date"
                      value={formState.due_date}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          due_date: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4">
                <div>
                  <p className="text-sm font-medium">Bill to</p>
                  <p className="text-xs text-muted-foreground">
                    Select the customer for this invoice.
                  </p>
                </div>
                <Select
                  value={formState.person_id}
                  onValueChange={(value) =>
                    onFormChange({ ...formState, person_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.email ? `${person.name} · ${person.email}` : person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Line items</p>
                    <p className="text-xs text-muted-foreground">
                      Add the services or products billed.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onFormChange({
                        ...formState,
                        items: [
                          ...formState.items,
                          { description: "", quantity: "1", unit_price: "0" },
                        ],
                      })
                    }
                  >
                    Add item
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground md:grid">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit price</span>
                    <span />
                  </div>
                  {formState.items.map((item, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                      <div className="grid gap-1">
                        <Label
                          className="text-xs text-muted-foreground md:sr-only"
                          htmlFor={`item-description-${index}`}
                        >
                          Description
                        </Label>
                        <Input
                          id={`item-description-${index}`}
                          placeholder="Description"
                          value={item.description}
                          onChange={(event) => {
                            const nextItems = [...formState.items]
                            nextItems[index] = {
                              ...item,
                              description: event.target.value,
                            }
                            onFormChange({ ...formState, items: nextItems })
                          }}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label
                          className="text-xs text-muted-foreground md:sr-only"
                          htmlFor={`item-qty-${index}`}
                        >
                          Quantity
                        </Label>
                        <Input
                          id={`item-qty-${index}`}
                          placeholder="Qty"
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(event) => {
                            const nextItems = [...formState.items]
                            nextItems[index] = {
                              ...item,
                              quantity: event.target.value,
                            }
                            onFormChange({ ...formState, items: nextItems })
                          }}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label
                          className="text-xs text-muted-foreground md:sr-only"
                          htmlFor={`item-price-${index}`}
                        >
                          Unit price
                        </Label>
                        <Input
                          id={`item-price-${index}`}
                          placeholder="Unit price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(event) => {
                            const nextItems = [...formState.items]
                            nextItems[index] = {
                              ...item,
                              unit_price: event.target.value,
                            }
                            onFormChange({ ...formState, items: nextItems })
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const nextItems = formState.items.filter((_, i) => i !== index)
                          onFormChange({
                            ...formState,
                            items: nextItems.length
                              ? nextItems
                              : [{ description: "", quantity: "1", unit_price: "0" }],
                          })
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4">
                <div className="grid gap-2">
                  <Label htmlFor="invoice-notes">Notes</Label>
                  <Textarea
                    id="invoice-notes"
                    value={formState.notes}
                    onChange={(event) =>
                      onFormChange({
                        ...formState,
                        notes: event.target.value,
                      })
                    }
                    placeholder="Invoice notes"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invoice-payment">Payment details</Label>
                  <Textarea
                    id="invoice-payment"
                    value={formState.payment_details}
                    onChange={(event) =>
                      onFormChange({
                        ...formState,
                        payment_details: event.target.value,
                      })
                    }
                    placeholder="Bank details or instructions"
                  />
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-tax">Tax rate (%)</Label>
                    <Input
                      id="invoice-tax"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formState.tax_rate}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          tax_rate: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="rounded-xl border bg-background/60 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(totals.subtotal, formState.currency)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatCurrency(totals.taxAmount, formState.currency)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span>{formatCurrency(totals.total, formState.currency)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Label className="text-xs text-muted-foreground">Send email</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant={formState.send_email ? "secondary" : "outline"}
                    onClick={() =>
                      onFormChange({
                        ...formState,
                        send_email: !formState.send_email,
                      })
                    }
                  >
                    {formState.send_email ? "Will send" : "Do not send"}
                  </Button>
                </div>
              </div>
            </div>
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
                    <AlertDialogTitle>Archive invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will hide the invoice from the list.
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
              <Button size="sm" onClick={onSave} disabled={isSaving || !formState.person_id}>
                {isSaving ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
