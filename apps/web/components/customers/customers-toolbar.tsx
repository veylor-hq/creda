"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import type { SortDirection, SortKey } from "@/components/customers/customers-types"
import { sortOptions } from "@/components/customers/customers-constants"

type CustomersToolbarProps = {
  countLabel: string
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: "all" | "active" | "deactivated"
  onStatusFilterChange: (value: "all" | "active" | "deactivated") => void
  sortKey: SortKey
  onSortChange: (value: SortKey) => void
  sortDirection: SortDirection
  onSortDirectionToggle: () => void
  onCreate: () => void
}

export function CustomersToolbar({
  countLabel,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  onSortChange,
  sortDirection,
  onSortDirectionToggle,
  onCreate,
}: CustomersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-medium">Customers</p>
        <p className="text-xs text-muted-foreground">
          Synced from the identity API.
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
        <Badge variant="outline">{countLabel}</Badge>
        <div className="flex flex-1 items-center gap-2 lg:flex-none">
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search customers"
            className="h-8 min-w-[180px] text-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as "active" | "deactivated")
            }
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(value) => onSortChange(value as SortKey)}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon-sm" onClick={onSortDirectionToggle}>
            <HugeiconsIcon
              icon={sortDirection === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
              strokeWidth={2}
            />
            <span className="sr-only">Toggle sort direction</span>
          </Button>
          <Button size="sm" onClick={onCreate}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
            Add customer
          </Button>
        </div>
      </div>
    </div>
  )
}
