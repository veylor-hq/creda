"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { CustomerFormSheet } from "@/components/customers/customer-form-sheet"
import { CustomersFilters } from "@/components/customers/customers-filters"
import { CustomersTableView } from "@/components/customers/customers-table-view"
import { CustomersToolbar } from "@/components/customers/customers-toolbar"
import {
  columns,
  emptyFormState,
  formFields,
  visibleColumnsStorageKey,
} from "@/components/customers/customers-constants"
import type {
  Customer,
  FormState,
  LoadState,
  SortDirection,
  SortKey,
} from "@/components/customers/customers-types"
import {
  buildPayload,
  getFormStateFromCustomer,
  getSearchableText,
} from "@/components/customers/customers-utils"

export function CustomersTable() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" })
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(
    columns.map((column) => column.id)
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "deactivated"
  >("active")
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null)
  const [formState, setFormState] = useState<FormState>(emptyFormState)
  const [initialFormState, setInitialFormState] = useState<FormState>(
    emptyFormState
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(visibleColumnsStorageKey)

    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as string[]
      const filtered = parsed.filter((id) =>
        columns.some((column) => column.id === id)
      )

      if (filtered.length) {
        setVisibleColumnIds(filtered)
      }
    } catch {
      localStorage.removeItem(visibleColumnsStorageKey)
    }
  }, [])

  useEffect(() => {
    async function loadCustomers() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setLoadState({
          status: "error",
          message: "NEXT_PUBLIC_API_URL is not defined",
        })
        return
      }

      setLoadState({ status: "loading" })

      const archivedParam =
        statusFilter === "all" ? "&archived=all" : `&archived=${statusFilter === "deactivated"}`
      const res = await fetch(`${API_URL}/api/private/identity/?include=details${archivedParam}`, {
        credentials: "include",
      })

      if (res.status === 401) {
        router.push("/signin")
        return
      }

      if (!res.ok) {
        setLoadState({ status: "error", message: "Failed to load customers" })
        return
      }

      const data = (await res.json()) as Customer[]
      setCustomers(data)
      setLoadState({ status: "ready" })
    }

    loadCustomers()
  }, [router, statusFilter])

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return customers
    }

    return customers.filter((customer) =>
      getSearchableText(customer).includes(query)
    )
  }, [customers, searchQuery])

  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers]

    sorted.sort((a, b) => {
      let valueA: string | number = ""
      let valueB: string | number = ""

      if (sortKey === "created_at") {
        valueA = a.created_at ? new Date(a.created_at).getTime() : 0
        valueB = b.created_at ? new Date(b.created_at).getTime() : 0
      } else if (sortKey === "email") {
        valueA = a.email ?? ""
        valueB = b.email ?? ""
      } else {
        valueA = a.name ?? ""
        valueB = b.name ?? ""
      }

      if (valueA < valueB) {
        return sortDirection === "asc" ? -1 : 1
      }

      if (valueA > valueB) {
        return sortDirection === "asc" ? 1 : -1
      }

      return 0
    })

    return sorted
  }, [filteredCustomers, sortDirection, sortKey])

  const countLabel = useMemo(() => {
    if (loadState.status === "loading") {
      return "Loading…"
    }

    if (loadState.status === "error") {
      return "Unavailable"
    }

    if (sortedCustomers.length !== customers.length) {
      return `${sortedCustomers.length} of ${customers.length}`
    }

    return `${customers.length} total`
  }, [customers.length, loadState.status, sortedCustomers.length])

  const visibleColumns = useMemo(
    () => columns.filter((column) => visibleColumnIds.includes(column.id)),
    [visibleColumnIds]
  )

  const isDirty = useMemo(
    () => formFields.some((field) => formState[field] !== initialFormState[field]),
    [formState, initialFormState]
  )

  const isSaveDisabled =
    isSaving || !formState.name.trim() || (sheetMode === "edit" && !isDirty)

  const toggleColumn = (columnId: string) => {
    setVisibleColumnIds((prev) => {
      if (prev.length === 1 && prev[0] === columnId) {
        return prev
      }

      const next = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]

      localStorage.setItem(visibleColumnsStorageKey, JSON.stringify(next))
      return next
    })
  }

  const openCreate = () => {
    setSheetMode("create")
    setActiveCustomer(null)
    setFormState(emptyFormState)
    setInitialFormState(emptyFormState)
    setFormError(null)
    setSheetOpen(true)
  }

  const openEdit = (customer: Customer) => {
    const nextState = getFormStateFromCustomer(customer)

    setSheetMode("edit")
    setActiveCustomer(customer)
    setFormState(nextState)
    setInitialFormState(nextState)
    setFormError(null)
    setSheetOpen(true)
  }

  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open)

    if (!open) {
      setFormError(null)
    }
  }

  const reloadCustomers = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    const archivedParam =
      statusFilter === "all" ? "&archived=all" : `&archived=${statusFilter === "deactivated"}`
    const res = await fetch(`${API_URL}/api/private/identity/?include=details${archivedParam}`, {
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      setLoadState({ status: "error", message: "Failed to refresh customers" })
      return
    }

    const data = (await res.json()) as Customer[]
    setCustomers(data)
    setLoadState({ status: "ready" })
  }

  const handleSave = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      setFormError("NEXT_PUBLIC_API_URL is not defined")
      return
    }

    if (!formState.name.trim()) {
      setFormError("Name is required")
      return
    }

    setIsSaving(true)
    setFormError(null)

    const payload = buildPayload(formState)
    const url =
      sheetMode === "edit" && activeCustomer
        ? `${API_URL}/api/private/identity/${activeCustomer.id}`
        : `${API_URL}/api/private/identity/`

    const res = await fetch(url, {
      method: sheetMode === "edit" ? "PATCH" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 401) {
      setIsSaving(false)
      router.push("/signin")
      return
    }

    if (!res.ok) {
      setFormError("Failed to save customer")
      setIsSaving(false)
      return
    }

    await reloadCustomers()
    setSheetOpen(false)
    setIsSaving(false)
  }

  const handleDeactivate = async () => {
    if (!activeCustomer) {
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      setFormError("NEXT_PUBLIC_API_URL is not defined")
      return
    }

    setIsDeleting(true)

    const res = await fetch(
      `${API_URL}/api/private/identity/${activeCustomer.id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    )

    if (res.status === 401) {
      setIsDeleting(false)
      router.push("/signin")
      return
    }

    if (!res.ok) {
      setFormError("Failed to deactivate customer")
      setIsDeleting(false)
      return
    }

    await reloadCustomers()
    setSheetOpen(false)
    setIsDeleting(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="rounded-xl border bg-card">
        <CustomersToolbar
          countLabel={countLabel}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortKey={sortKey}
          onSortChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionToggle={() =>
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          onCreate={openCreate}
        />
        <CustomersFilters
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onToggleColumn={toggleColumn}
        />
        <CustomersTableView
          customers={sortedCustomers}
          visibleColumns={visibleColumns}
          loadState={loadState}
          onRowClick={openEdit}
        />
      </div>

      <CustomerFormSheet
        open={sheetOpen}
        mode={sheetMode}
        formState={formState}
        formError={formError}
        isSaving={isSaving}
        isDeleting={isDeleting}
        isSaveDisabled={isSaveDisabled}
        onOpenChange={handleSheetChange}
        onSave={handleSave}
        onDeactivate={handleDeactivate}
        onCancel={() => setSheetOpen(false)}
        onFormChange={setFormState}
      />
    </div>
  )
}
