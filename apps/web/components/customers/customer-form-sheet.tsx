"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { FormState } from "@/components/customers/customers-types"

type CustomerFormSheetProps = {
  open: boolean
  mode: "create" | "edit"
  formState: FormState
  formError: string | null
  isSaving: boolean
  isDeleting: boolean
  isSaveDisabled: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onDeactivate: () => void
  onCancel: () => void
  onFormChange: (next: FormState) => void
}

export function CustomerFormSheet({
  open,
  mode,
  formState,
  formError,
  isSaving,
  isDeleting,
  isSaveDisabled,
  onOpenChange,
  onSave,
  onDeactivate,
  onCancel,
  onFormChange,
}: CustomerFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "New customer" : "Edit customer"}</SheetTitle>
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
                <Label htmlFor="customer-name">Name</Label>
                <Input
                  id="customer-name"
                  value={formState.name}
                  onChange={(event) =>
                    onFormChange({ ...formState, name: event.target.value })
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
                    onFormChange({ ...formState, email: event.target.value })
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
                    onFormChange({ ...formState, billing_email: event.target.value })
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
                    onFormChange({ ...formState, contact_person: event.target.value })
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
                    onFormChange({ ...formState, phone: event.target.value })
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
                      onFormChange({ ...formState, website: event.target.value })
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
                    onFormChange({ ...formState, address_line1: event.target.value })
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
                    onFormChange({ ...formState, address_line2: event.target.value })
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
                      onFormChange({ ...formState, address_city: event.target.value })
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
                      onFormChange({ ...formState, address_county: event.target.value })
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
                      onFormChange({ ...formState, address_country: event.target.value })
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
                    onFormChange({ ...formState, expense_tags: event.target.value })
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
                    onFormChange({ ...formState, tax_id: event.target.value })
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
                    onFormChange({ ...formState, note: event.target.value })
                  }
                  placeholder="Add a note"
                />
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
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
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            <div className="flex gap-2 sm:justify-end">
              <Button variant="outline" size="sm" onClick={onCancel}>
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
