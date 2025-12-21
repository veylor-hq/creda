"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type {
  IncomeSourceType,
  IncomeTransaction,
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

export function TransactionsTab() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([])
  const [people, setPeople] = useState<PersonSummary[]>([])
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<IncomeSourceType | "all">(
    "all"
  )
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [reconciledFilter, setReconciledFilter] = useState<"all" | "true" | "false">(
    "all"
  )
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

      const res = await fetch(`${API_URL}/api/private/identity/`, {
        credentials: "include",
      })

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
    async function loadTransactions() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setLoadState("error")
        return
      }

      setLoadState("loading")

      const params = new URLSearchParams()
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
      const url = params.toString()
        ? `${API_URL}/api/private/income/?${params.toString()}`
        : `${API_URL}/api/private/income/`
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

      const data = (await res.json()) as TransactionListItem[]
      setTransactions(data.map(normalizeListItem))
      setLoadState("ready")
    }

    loadTransactions()
  }, [router, sourceFilter, dateFrom, dateTo, minAmount, maxAmount, reconciledFilter])

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
    setFormState({ ...emptyFormState, received_at: new Date().toISOString().slice(0, 10) })
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

    const params = new URLSearchParams()
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
    const url = params.toString()
      ? `${API_URL}/api/private/income/?${params.toString()}`
      : `${API_URL}/api/private/income/`
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

    const data = (await res.json()) as TransactionListItem[]
    setTransactions(data.map(normalizeListItem))
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
          onCreate={openCreate}
        />
        <TransactionsTable
          transactions={filteredTransactions}
          people={people}
          onSelect={openEdit}
        />
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
