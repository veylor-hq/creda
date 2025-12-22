"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type {
  IncomeSourceType,
  IncomeTransaction,
  InvoiceSummary,
  LoadState,
  PersonSummary,
  TransactionListItem,
} from "@/components/income/transactions-types"
import { TransactionsToolbar } from "@/components/income/transactions-toolbar"
import { TransactionsTable } from "@/components/income/transactions-table"
import { TransactionDrawer } from "@/components/income/transaction-drawer"
import {
  buildPayload,
  emptyFormState,
  normalizeListItem,
  toFormState,
} from "@/components/income/transactions-utils"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"

const sortOptions = [
  { value: "received_at:desc", label: "Date (newest)" },
  { value: "received_at:asc", label: "Date (oldest)" },
  { value: "amount:desc", label: "Amount (high to low)" },
  { value: "amount:asc", label: "Amount (low to high)" },
]

type IncomeListResponse = {
  items: TransactionListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export function TransactionsTab() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([])
  const [people, setPeople] = useState<PersonSummary[]>([])
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<IncomeSourceType | "all">(
    "all"
  )
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [reconciledFilter, setReconciledFilter] = useState<
    "all" | "true" | "false"
  >("all")
  const [sortValue, setSortValue] = useState(sortOptions[0].value)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create")
  const [activeTransaction, setActiveTransaction] = useState<
    IncomeTransaction | null
  >(null)
  const [formState, setFormState] = useState(emptyFormState)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadPeople() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        return
      }

      const res = await fetch(
        `${API_URL}/api/private/identity/?archived=all`,
        {
          credentials: "include",
        }
      )

      if (res.status === 401) {
        router.push("/signin")
        return
      }

      if (!res.ok) {
        return
      }

      const data = (await res.json()) as PersonSummary[]
      setPeople(data)
    }

    loadPeople()
  }, [router])

  useEffect(() => {
    async function loadInvoices() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        return
      }

      const params = new URLSearchParams({
        page: "1",
        page_size: "100",
        sort_by: "issue_date",
        sort_dir: "desc",
      })

      const res = await fetch(`${API_URL}/api/private/invoice/?${params.toString()}`, {
        credentials: "include",
      })

      if (res.status === 401) {
        router.push("/signin")
        return
      }

      if (!res.ok) {
        return
      }

      const data = (await res.json()) as { items: InvoiceSummary[] }
      const normalizeId = (value: unknown) => {
        if (typeof value === "string") {
          return value
        }
        if (
          value &&
          typeof value === "object" &&
          "$oid" in value &&
          typeof (value as { $oid: string }).$oid === "string"
        ) {
          return (value as { $oid: string }).$oid
        }
        return ""
      }
      const normalized = data.items.map((invoice) => ({
        ...invoice,
        id: normalizeId(
          (invoice as InvoiceSummary & { _id?: unknown }).id ??
            (invoice as InvoiceSummary & { _id?: unknown })._id
        ),
        person_id: normalizeId(
          (invoice as InvoiceSummary & { person_id: unknown }).person_id
        ),
      }))
      setInvoices(normalized)
    }

    loadInvoices()
  }, [router])

  useEffect(() => {
    const shouldOpen = localStorage.getItem("open-income-dialog")
    if (shouldOpen) {
      localStorage.removeItem("open-income-dialog")
      openCreate()
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => {
      openCreate()
    }

    window.addEventListener("app:open-income-dialog", handleOpen)
    return () => window.removeEventListener("app:open-income-dialog", handleOpen)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, sourceFilter, dateFrom, dateTo, minAmount, maxAmount, reconciledFilter, sortValue])

  useEffect(() => {
    async function loadTransactions() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setLoadState("error")
        return
      }

      setLoadState("loading")

      const [sort_by, sort_dir] = sortValue.split(":")
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by,
        sort_dir,
      })
      if (sourceFilter !== "all") {
        params.set("source_type", sourceFilter)
      }
      if (dateFrom) {
        params.set("from_date", dateFrom)
      }
      if (dateTo) {
        params.set("to_date", dateTo)
      }
      if (minAmount) {
        params.set("min_amount", minAmount)
      }
      if (maxAmount) {
        params.set("max_amount", maxAmount)
      }
      if (reconciledFilter !== "all") {
        params.set("is_reconciled", reconciledFilter)
      }

      const url = `${API_URL}/api/private/income/?${params.toString()}`
      const res = await fetch(url, {
        credentials: "include",
      })

      if (res.status === 401) {
        router.push("/signin")
        return
      }

      if (!res.ok) {
        setLoadState("error")
        return
      }

      const data = (await res.json()) as IncomeListResponse
      setTransactions(data.items.map(normalizeListItem))
      setTotalPages(data.pages)
      setTotalCount(data.total)
      setLoadState("ready")
    }

    loadTransactions()
  }, [
    router,
    page,
    pageSize,
    sourceFilter,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    reconciledFilter,
    sortValue,
  ])

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return transactions
    }

    const peopleMap = new Map(
      people.map((person) => [person.id, person.name.toLowerCase()])
    )

    return transactions.filter((transaction) => {
      const personName = peopleMap.get(transaction.person_id) ?? ""
      return (
        transaction.reference?.toLowerCase().includes(query) ||
        personName.includes(query)
      )
    })
  }, [transactions, search, people])

  const openCreate = () => {
    setDrawerMode("create")
    setActiveTransaction(null)
    setFormState({
      ...emptyFormState,
      received_at: new Date().toISOString().slice(0, 10),
    })
    setDrawerOpen(true)
  }

  const openEdit = (transaction: IncomeTransaction) => {
    setDrawerMode("edit")
    setActiveTransaction(transaction)
    setFormState(toFormState(transaction))
    setDrawerOpen(true)
  }

  const reloadTransactions = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    const [sort_by, sort_dir] = sortValue.split(":")
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_by,
      sort_dir,
    })
    if (sourceFilter !== "all") {
      params.set("source_type", sourceFilter)
    }
    if (dateFrom) {
      params.set("from_date", dateFrom)
    }
    if (dateTo) {
      params.set("to_date", dateTo)
    }
    if (minAmount) {
      params.set("min_amount", minAmount)
    }
    if (maxAmount) {
      params.set("max_amount", maxAmount)
    }
    if (reconciledFilter !== "all") {
      params.set("is_reconciled", reconciledFilter)
    }

    const url = `${API_URL}/api/private/income/?${params.toString()}`
    const res = await fetch(url, {
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      setLoadState("error")
      return
    }

    const data = (await res.json()) as IncomeListResponse
    setTransactions(data.items.map(normalizeListItem))
    setTotalPages(data.pages)
    setTotalCount(data.total)
    setLoadState("ready")
  }

  const handleSave = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    setIsSaving(true)
    const payload = buildPayload(formState)

    const res = await fetch(
      drawerMode === "edit" && activeTransaction
        ? `${API_URL}/api/private/income/${activeTransaction.id}`
        : `${API_URL}/api/private/income/`,
      {
        method: drawerMode === "edit" ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsSaving(false)

    if (!res.ok) {
      return
    }

    await reloadTransactions()
    setDrawerOpen(false)
    if (drawerMode === "create") {
      trackEvent("income_created", {
        source_type: formState.source_type,
        currency: formState.currency,
        has_invoice: Boolean(formState.invoice_id),
      })
    } else {
      trackEvent("income_updated", {
        source_type: formState.source_type,
        currency: formState.currency,
        has_invoice: Boolean(formState.invoice_id),
      })
    }
  }

  const handleDelete = async () => {
    if (!activeTransaction) {
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    setIsDeleting(true)

    const res = await fetch(
      `${API_URL}/api/private/income/${activeTransaction.id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    )

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    setIsDeleting(false)

    if (!res.ok) {
      return
    }

    await reloadTransactions()
    setDrawerOpen(false)
    trackEvent("income_archived")
  }

  const isSaveDisabled =
    !formState.person_id ||
    !formState.amount ||
    !formState.received_at ||
    isSaving

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="rounded-xl border bg-card">
        <TransactionsToolbar
          search={search}
          onSearchChange={setSearch}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          minAmount={minAmount}
          maxAmount={maxAmount}
          reconciledFilter={reconciledFilter}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onMinAmountChange={setMinAmount}
          onMaxAmountChange={setMaxAmount}
          onReconciledFilterChange={setReconciledFilter}
          sortValue={sortValue}
          onSortChange={setSortValue}
          sortOptions={sortOptions}
          onCreate={openCreate}
        />
        <TransactionsTable
          transactions={filteredTransactions}
          people={people}
          onSelect={openEdit}
        />
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
        {loadState === "loading" && (
          <div className="px-4 py-3 text-xs text-muted-foreground">Loading…</div>
        )}
        {loadState === "error" && (
          <div className="px-4 py-3 text-xs text-destructive">
            Failed to load transactions.
          </div>
        )}
      </div>

      <TransactionDrawer
        open={drawerOpen}
        mode={drawerMode}
        formState={formState}
        people={people}
        invoices={invoices}
        isSaving={isSaving}
        isDeleting={isDeleting}
        isSaveDisabled={isSaveDisabled}
        onOpenChange={setDrawerOpen}
        onFormChange={setFormState}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
