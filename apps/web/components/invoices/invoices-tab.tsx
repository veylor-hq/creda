"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { InvoicesToolbar } from "@/components/invoices/invoices-toolbar"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { InvoiceDialog } from "@/components/invoices/invoice-dialog"
import type {
  Invoice,
  InvoiceFormState,
  InvoiceListItem,
  InvoiceListResponse,
  InvoiceStatus,
  PersonSummary,
} from "@/components/invoices/invoices-types"
import {
  buildInvoicePayload,
  emptyInvoiceForm,
  toInvoiceForm,
} from "@/components/invoices/invoices-utils"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"

export function InvoicesTab() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [people, setPeople] = useState<PersonSummary[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all")
  const [sortValue, setSortValue] = useState("issue_date:desc")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null)
  const [formState, setFormState] = useState<InvoiceFormState>(emptyInvoiceForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  )

  useEffect(() => {
    async function loadPeople() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        return
      }

      const res = await fetch(`${API_URL}/api/private/identity/?archived=all`, {
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
  }, [router, refreshToken])

  useEffect(() => {
    const shouldOpen = localStorage.getItem("open-invoice-dialog")
    if (shouldOpen) {
      localStorage.removeItem("open-invoice-dialog")
      openCreate()
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => {
      openCreate()
    }

    window.addEventListener("app:open-invoice-dialog", handleOpen)
    return () => window.removeEventListener("app:open-invoice-dialog", handleOpen)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, sortValue])

  useEffect(() => {
    if (!dialogOpen) {
      setNotice(null)
    }
  }, [dialogOpen])

  useEffect(() => {
    async function loadInvoices() {
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

      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

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

      const data = (await res.json()) as InvoiceListResponse
      setInvoices(data.items)
      setTotalPages(data.pages)
      setTotalCount(data.total)
    }

    loadInvoices()
  }, [router, page, pageSize, statusFilter, sortValue, refreshToken])

  useEffect(() => {
    const handleWorkspaceChange = () => {
      setRefreshToken((prev) => prev + 1)
    }

    window.addEventListener("app:workspace-changed", handleWorkspaceChange)
    return () =>
      window.removeEventListener("app:workspace-changed", handleWorkspaceChange)
  }, [])

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return invoices
    }

    const peopleMap = new Map(
      people.map((person) => [person.id, person.name.toLowerCase()])
    )

    return invoices.filter((invoice) => {
      const personName = peopleMap.get(invoice.person_id) ?? ""
      return (
        invoice.number.toLowerCase().includes(query) || personName.includes(query)
      )
    })
  }, [invoices, search, people])

  const openCreate = () => {
    setDialogMode("create")
    setActiveInvoice(null)
    setFormState({ ...emptyInvoiceForm })
    setNotice(null)
    setDialogOpen(true)
  }

  const openEdit = async (invoice: InvoiceListItem) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    const res = await fetch(`${API_URL}/api/private/invoice/${invoice.id}`, {
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      return
    }

    const data = (await res.json()) as Invoice
    const normalized = {
      ...data,
      id: (data as Invoice & { _id?: string }).id ?? (data as Invoice & { _id?: string })._id,
    }
    setActiveInvoice(normalized)
    setFormState(toInvoiceForm(data))
    setDialogMode("edit")
    setNotice(null)
    setDialogOpen(true)
  }

  const reloadInvoices = async () => {
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

    if (statusFilter !== "all") {
      params.set("status", statusFilter)
    }

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

    const data = (await res.json()) as InvoiceListResponse
    setInvoices(data.items)
    setTotalPages(data.pages)
    setTotalCount(data.total)
  }

  const handleSave = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    if (dialogMode === "edit" && !activeInvoice?.id) {
      setNotice({ tone: "error", message: "Missing invoice id. Reopen the invoice." })
      return
    }

    setIsSaving(true)
    const payload = buildInvoicePayload(formState)

    const res = await fetch(
      dialogMode === "edit" && activeInvoice
        ? `${API_URL}/api/private/invoice/${activeInvoice.id}`
        : `${API_URL}/api/private/invoice/`,
      {
        method: dialogMode === "edit" ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (res.status === 401) {
      router.push("/signin")
      setIsSaving(false)
      return
    }

    setIsSaving(false)

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      const message =
        typeof errorBody?.detail === "string"
          ? errorBody.detail
          : "Failed to save invoice."
      setNotice({ tone: "error", message })
      return
    }

    await reloadInvoices()
    setDialogOpen(false)
    setNotice({ tone: "success", message: "Invoice saved." })
    if (dialogMode === "create") {
      trackEvent("invoice_created", {
        currency: formState.currency,
        item_count: formState.items.length,
        is_public: formState.is_public,
        send_email: formState.send_email,
      })
    } else {
      trackEvent("invoice_updated", {
        currency: formState.currency,
        item_count: formState.items.length,
        is_public: formState.is_public,
      })
      if (activeInvoice?.status && activeInvoice.status !== formState.status) {
        trackEvent("invoice_status_changed", {
          from: activeInvoice.status,
          to: formState.status,
        })
        if (activeInvoice.status !== "paid" && formState.status === "paid") {
          trackEvent("income_created_from_invoice_paid")
        }
      }
    }
  }

  const handleDelete = async () => {
    if (!activeInvoice?.id) {
      setNotice({ tone: "error", message: "Missing invoice id. Reopen the invoice." })
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    setIsDeleting(true)

    const res = await fetch(`${API_URL}/api/private/invoice/${activeInvoice.id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/signin")
      setIsDeleting(false)
      return
    }

    setIsDeleting(false)

    if (!res.ok) {
      setNotice({ tone: "error", message: "Failed to archive invoice." })
      return
    }

    await reloadInvoices()
    setDialogOpen(false)
    trackEvent("invoice_archived")
  }

  const handleSendEmail = async () => {
    if (!activeInvoice?.id) {
      setNotice({ tone: "error", message: "Save the invoice before sending." })
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    const res = await fetch(`${API_URL}/api/private/invoice/${activeInvoice.id}/send`, {
      method: "POST",
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      const message =
        typeof errorBody?.detail === "string"
          ? errorBody.detail
          : "Failed to send email."
      setNotice({ tone: "error", message })
      return
    }

    setNotice({ tone: "success", message: "Invoice email sent." })
    trackEvent("invoice_email_sent")
  }

  const handleSendReminder = async () => {
    if (!activeInvoice?.id) {
      setNotice({ tone: "error", message: "Save the invoice before sending." })
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    if (!API_URL) {
      return
    }

    const res = await fetch(`${API_URL}/api/private/invoice/${activeInvoice.id}/send-reminder`, {
      method: "POST",
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/signin")
      return
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      const message =
        typeof errorBody?.detail === "string"
          ? errorBody.detail
          : "Failed to send reminder."
      setNotice({ tone: "error", message })
      return
    }

    setNotice({ tone: "success", message: "Reminder sent." })
    trackEvent("invoice_reminder_sent")
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="rounded-xl border bg-card">
        <InvoicesToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortValue={sortValue}
          onSortChange={setSortValue}
          onCreate={openCreate}
        />
        <InvoicesTable invoices={filteredInvoices} people={people} onSelect={openEdit} />
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
      </div>

      <InvoiceDialog
        open={dialogOpen}
        mode={dialogMode}
        invoice={activeInvoice}
        formState={formState}
        people={people}
        isSaving={isSaving}
        isDeleting={isDeleting}
        notice={notice}
        onOpenChange={setDialogOpen}
        onFormChange={setFormState}
        onSave={handleSave}
        onDelete={handleDelete}
        onSendEmail={handleSendEmail}
        onSendReminder={handleSendReminder}
      />
    </div>
  )
}
