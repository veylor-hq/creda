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
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import type { IncomeSourceType } from "@/components/income/transactions-types"

const sourceTypes: Array<{ value: IncomeSourceType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "payroll", label: "Payroll" },
  { value: "cash", label: "Cash" },
  { value: "manual", label: "Manual" },
]

type TransactionsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  sourceFilter: IncomeSourceType | "all"
  onSourceFilterChange: (value: IncomeSourceType | "all") => void
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  reconciledFilter: "all" | "true" | "false"
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onMinAmountChange: (value: string) => void
  onMaxAmountChange: (value: string) => void
  onReconciledFilterChange: (value: "all" | "true" | "false") => void
  onCreate: () => void
}

export function TransactionsToolbar({
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  dateFrom,
  dateTo,
  minAmount,
  maxAmount,
  reconciledFilter,
  onDateFromChange,
  onDateToChange,
  onMinAmountChange,
  onMaxAmountChange,
  onReconciledFilterChange,
  onCreate,
}: TransactionsToolbarProps) {
  return (
    <div className="border-b px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium">Income transactions</p>
          <p className="text-xs text-muted-foreground">
            Bank-style ledger for incoming money.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by reference, customer"
            className="h-8 min-w-[180px] text-sm"
          />
          <Select
            value={sourceFilter}
            onValueChange={(value) => onSourceFilterChange(value as IncomeSourceType | "all")}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {sourceTypes.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onCreate}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
            Add income
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          className="h-8 w-[140px] text-xs"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          className="h-8 w-[140px] text-xs"
        />
        <Input
          type="number"
          min="0"
          step="1"
          value={minAmount}
          onChange={(event) => onMinAmountChange(event.target.value)}
          placeholder="Min £"
          className="h-8 w-[120px] text-xs"
        />
        <Input
          type="number"
          min="0"
          step="1"
          value={maxAmount}
          onChange={(event) => onMaxAmountChange(event.target.value)}
          placeholder="Max £"
          className="h-8 w-[120px] text-xs"
        />
        <Select
          value={reconciledFilter}
          onValueChange={(value) =>
            onReconciledFilterChange(value as "all" | "true" | "false")
          }
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Reconciled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Reconciled</SelectItem>
            <SelectItem value="false">Unreconciled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
