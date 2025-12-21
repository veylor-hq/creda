"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { FormState } from "@/components/customers/customers-types"
import { CustomerIncomePanel } from "@/components/customers/customer-income-panel"

const tabs = [
  { id: "details", label: "Details" },
  { id: "transactions", label: "Transactions" },
] as const

type CustomerFormSheetProps = {
  open: boolean
  mode: "create" | "edit"
  customerId?: string | null
  isArchived?: boolean
  formState: FormState
  formError: string | null
  isSaving: boolean
  isDeleting: boolean
  isSaveDisabled: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onDeactivate: () => void
  onReactivate: () => void
  onCancel: () => void
  onFormChange: (next: FormState) => void
}

export function CustomerFormSheet({
  open,
  mode,
  customerId,
  isArchived = false,
  formState,
  formError,
  isSaving,
  isDeleting,
  isSaveDisabled,
  onOpenChange,
  onSave,
  onDeactivate,
  onReactivate,
  onCancel,
  onFormChange,
}: CustomerFormSheetProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>(
    "details"
  )

  useEffect(() => {
    if (open) {
      setActiveTab("details")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(720px,85vh)] w-[min(860px,92vw)] overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">Customer</DialogTitle>
        <DialogDescription className="sr-only">
          Edit customer details and view transactions.
        </DialogDescription>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <p className="text-sm font-medium">
                {mode === "create" ? "New customer" : "Customer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArchived
                  ? "This customer is archived"
                  : "Manage customer details"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  disabled={tab.id === "transactions" && mode === "create"}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    activeTab === tab.id
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeTab === "details" ? (
              <form
                className="flex w-full max-w-xl flex-col gap-4 mx-auto"
                onSubmit={(event) => {
                  event.preventDefault()
                  onSave()
                }}
              >
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customer-name">Name</Label>
                    <Input
                      id="customer-name"
                      value={formState.name}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          name: event.target.value,
                        })
                      }
                      placeholder="Customer name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={formState.email}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          email: event.target.value,
                        })
                      }
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-billing">Billing email</Label>
                    <Input
                      id="customer-billing"
                      type="email"
                      value={formState.billing_email}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          billing_email: event.target.value,
                        })
                      }
                      placeholder="billing@company.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-contact">Contact person</Label>
                    <Input
                      id="customer-contact"
                      value={formState.contact_person}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          contact_person: event.target.value,
                        })
                      }
                      placeholder="Primary contact"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="customer-phone">Phone</Label>
                      <Input
                        id="customer-phone"
                        value={formState.phone}
                        onChange={(event) =>
                          onFormChange({
                            ...formState,
                            phone: event.target.value,
                          })
                        }
                        placeholder="+44 20 7946 0958"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer-website">Website</Label>
                      <Input
                        id="customer-website"
                        value={formState.website}
                        onChange={(event) =>
                          onFormChange({
                            ...formState,
                            website: event.target.value,
                          })
                        }
                        placeholder="https://"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-address-1">Address line 1</Label>
                    <Input
                      id="customer-address-1"
                      value={formState.address_line1}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          address_line1: event.target.value,
                        })
                      }
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-address-2">Address line 2</Label>
                    <Input
                      id="customer-address-2"
                      value={formState.address_line2}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          address_line2: event.target.value,
                        })
                      }
                      placeholder="Suite, floor, etc."
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="customer-city">City</Label>
                      <Input
                        id="customer-city"
                        value={formState.address_city}
                        onChange={(event) =>
                          onFormChange({
                            ...formState,
                            address_city: event.target.value,
                          })
                        }
                        placeholder="City"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer-county">County</Label>
                      <Input
                        id="customer-county"
                        value={formState.address_county}
                        onChange={(event) =>
                          onFormChange({
                            ...formState,
                            address_county: event.target.value,
                          })
                        }
                        placeholder="County"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="customer-postcode">Postcode</Label>
                      <Input
                        id="customer-postcode"
                        value={formState.address_postcode}
                        onChange={(event) =>
                          onFormChange({
                            ...formState,
                            address_postcode: event.target.value,
                          })
                        }
                        placeholder="Postcode"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer-country">Country</Label>
                      <Input
                        id="customer-country"
                        value={formState.address_country}
                        onChange={(event) =>
                          onFormChange({
                            ...formState,
                            address_country: event.target.value,
                          })
                        }
                        placeholder="Country"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-tags">Expense tags</Label>
                    <Input
                      id="customer-tags"
                      value={formState.expense_tags}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          expense_tags: event.target.value,
                        })
                      }
                      placeholder="Enterprise, priority"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-tax">Tax ID</Label>
                    <Input
                      id="customer-tax"
                      value={formState.tax_id}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          tax_id: event.target.value,
                        })
                      }
                      placeholder="Tax identifier"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-note">Notes</Label>
                    <Textarea
                      id="customer-note"
                      value={formState.note}
                      onChange={(event) =>
                        onFormChange({
                          ...formState,
                          note: event.target.value,
                        })
                      }
                      placeholder="Add a note"
                    />
                  </div>
                </div>
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
              </form>
            ) : (
              <div className="flex w-full max-w-xl flex-col gap-4 mx-auto">
                {mode === "edit" && customerId ? (
                  <CustomerIncomePanel personId={customerId} />
                ) : (
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Save the customer first to view transactions.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t px-5 py-4">
            {mode === "edit" ? (
              isArchived ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Reactivate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reactivate customer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will restore the customer to active status.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onReactivate}>
                        Reactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      disabled={isDeleting}
                    >
                      Deactivate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate customer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will archive the customer and hide it from the list.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={onDeactivate}>
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={isSaveDisabled || isArchived}>
                {isSaving ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
