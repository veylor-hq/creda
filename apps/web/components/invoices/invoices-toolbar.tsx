"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InvoiceStatus } from "@/components/invoices/invoices-types"

const statusOptions: Array<{ value: InvoiceStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
  { value: "canceled", label: "Canceled" },
]

const sortOptions = [
  { value: "issue_date:desc", label: "Issue date (newest)" },
  { value: "issue_date:asc", label: "Issue date (oldest)" },
  { value: "due_date:asc", label: "Due date (soonest)" },
  { value: "due_date:desc", label: "Due date (latest)" },
  { value: "total:desc", label: "Total (high to low)" },
  { value: "total:asc", label: "Total (low to high)" },
]

type InvoicesToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: InvoiceStatus | "all"
  onStatusFilterChange: (value: InvoiceStatus | "all") => void
  sortValue: string
  onSortChange: (value: string) => void
  onCreate: () => void
}

export function InvoicesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortValue,
  onSortChange,
  onCreate,
}: InvoicesToolbarProps) {
  return (
    <div className="border-b px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium">Invoices</p>
          <p className="text-xs text-muted-foreground">
            Draft, issued, and paid invoices.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by number or customer"
            className="h-8 min-w-[180px] text-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as InvoiceStatus | "all")
            }
          >
            <SelectTrigger size="sm">
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
          <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onCreate}>
            New invoice
          </Button>
        </div>
      </div>
    </div>
  )
}
