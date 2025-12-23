"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
})

type CustomerListItem = {
  id: string
  name: string
  email?: string | null
  contact_person?: string | null
}

type IncomeListItem = {
  id: string
  person_id: string
  amount: number
  currency: string
  source_type: string
  reference?: string | null
  status: "received" | "planned"
  received_at: string
  is_reconciled: boolean
}

type IncomeSummary = {
  count: number
  total_amount: number
  reconciled_count: number
}

type IncomeListResponse = {
  items: IncomeListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

type LoadState = "idle" | "loading" | "error" | "ready"

export function DashboardOverview() {
  const router = useRouter()
  const [activeCustomers, setActiveCustomers] = useState<CustomerListItem[]>([])
  const [archivedCustomers, setArchivedCustomers] = useState<CustomerListItem[]>([])
  const [recentIncome, setRecentIncome] = useState<IncomeListItem[]>([])
  const [summary, setSummary] = useState<IncomeSummary | null>(null)
  const [monthSummary, setMonthSummary] = useState<IncomeSummary | null>(null)
  const [plannedSummary, setPlannedSummary] = useState<IncomeSummary | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    async function loadStats() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setLoadState("error")
        return
      }

      setLoadState("loading")

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthParams = new URLSearchParams({
        from_date: monthStart.toISOString(),
      })

      const [activeRes, archivedRes, incomeRes, summaryRes, monthRes, plannedRes] =
        await Promise.all([
          fetch(`${API_URL}/api/private/identity/?archived=false`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/private/identity/?archived=true`, {
            credentials: "include",
          }),
          fetch(
            `${API_URL}/api/private/income/?page=1&page_size=4&sort_by=received_at&sort_dir=desc&status=received`,
            {
              credentials: "include",
            }
          ),
          fetch(`${API_URL}/api/private/income/summary?status=received`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/private/income/summary?${monthParams.toString()}&status=received`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/private/income/summary?status=planned`, {
            credentials: "include",
          }),
        ])

      if ([activeRes, archivedRes, incomeRes, summaryRes, monthRes, plannedRes].some((res) => res.status === 401)) {
        router.push("/signin")
        return
      }

      if (![activeRes, archivedRes, incomeRes, summaryRes, monthRes, plannedRes].every((res) => res.ok)) {
        setLoadState("error")
        return
      }

      const [activeData, archivedData, incomeData, summaryData, monthData, plannedData] =
        (await Promise.all([
          activeRes.json(),
          archivedRes.json(),
          incomeRes.json(),
          summaryRes.json(),
          monthRes.json(),
          plannedRes.json(),
        ])) as [
          CustomerListItem[],
          CustomerListItem[],
          IncomeListResponse,
          IncomeSummary,
          IncomeSummary,
          IncomeSummary,
        ]

      setActiveCustomers(activeData)
      setArchivedCustomers(archivedData)
      setRecentIncome(incomeData.items)
      setSummary(summaryData)
      setMonthSummary(monthData)
      setPlannedSummary(plannedData)
      setLoadState("ready")
    }

    loadStats()
  }, [router, refreshToken])

  useEffect(() => {
    const handleWorkspaceChange = () => {
      setRefreshToken((prev) => prev + 1)
    }

    window.addEventListener("app:workspace-changed", handleWorkspaceChange)
    return () =>
      window.removeEventListener("app:workspace-changed", handleWorkspaceChange)
  }, [])


  const totalCustomers = activeCustomers.length + archivedCustomers.length
  const reconciledCount = summary?.reconciled_count ?? 0
  const totalIncome = summary?.total_amount ?? 0
  const monthIncome = monthSummary?.total_amount ?? 0
  const plannedIncome = plannedSummary?.total_amount ?? 0
  const plannedCount = plannedSummary?.count ?? 0

  const incomeBars = useMemo(() => {
    const recent = recentIncome.map((income) => income.amount)
    const max = Math.max(...recent, 1)
    return recent.map((amount) => Math.round((amount / max) * 100))
  }, [recentIncome])

  const recentCustomers = activeCustomers.slice(0, 4)

  const statusBadge = (() => {
    if (loadState === "loading") return "Loading…"
    if (loadState === "error") return "Unavailable"
    return `${activeCustomers.length} active`
  })()

  const handleAddCustomer = () => {
    localStorage.setItem("open-customer-dialog", "true")
    window.dispatchEvent(
      new CustomEvent("app:switch-tab", { detail: { tabId: "customers" } })
    )
  }

  const handleAddIncome = () => {
    localStorage.setItem("open-income-dialog", "true")
    window.dispatchEvent(
      new CustomEvent("app:switch-tab", { detail: { tabId: "income" } })
    )
  }

  const handleAddInvoice = () => {
    localStorage.setItem("open-invoice-dialog", "true")
    window.dispatchEvent(
      new CustomEvent("app:switch-tab", { detail: { tabId: "invoices" } })
    )
  }

  const handleOpenInvoices = () => {
    window.dispatchEvent(
      new CustomEvent("app:switch-tab", { detail: { tabId: "invoices" } })
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10" />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Cashflow overview
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {loadState === "ready" ? currencyFormatter.format(totalIncome) : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total income recorded across your workspace.
                </p>
              </div>
              <Badge variant="outline">{statusBadge}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleAddCustomer}>
                Add customer
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddIncome}>
                Add transaction
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddInvoice}>
                Add invoice
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">Customers</p>
                <p className="mt-2 text-2xl font-semibold">
                  {loadState === "ready" ? totalCustomers : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {archivedCustomers.length} archived
                </p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">Income this month</p>
                <p className="mt-2 text-2xl font-semibold">
                  {loadState === "ready" ? currencyFormatter.format(monthIncome) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Current month to date</p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">Reconciled</p>
                <p className="mt-2 text-2xl font-semibold">
                  {loadState === "ready" ? reconciledCount : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(summary?.count ?? 0) - reconciledCount} pending
                </p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">Planned income</p>
                <p className="mt-2 text-2xl font-semibold">
                  {loadState === "ready" ? currencyFormatter.format(plannedIncome) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {plannedCount} planned entries
                </p>
              </div>
            </div>
              <div className="rounded-2xl border bg-background/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Recent income amounts</p>
                <span className="text-xs text-muted-foreground">
                  Last 4 transactions · scaled by value
                </span>
              </div>
              <div className="mt-4 flex h-16 items-end gap-2">
                {incomeBars.map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-md bg-emerald-500/70"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border bg-card p-5">
            <p className="text-sm font-medium">Workspace snapshot</p>
            <p className="text-xs text-muted-foreground">Latest signals at a glance.</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active customers</p>
                  <p className="text-xs text-muted-foreground">Ready to bill</p>
                </div>
                <span className="text-lg font-semibold">
                  {loadState === "ready" ? activeCustomers.length : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Latest income</p>
                  <p className="text-xs text-muted-foreground">Most recent entry</p>
                </div>
                <span className="text-sm font-semibold">
                  {recentIncome[0]
                    ? currencyFormatter.format(recentIncome[0].amount)
                    : "—"}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={handleOpenInvoices}
            >
              View invoices
            </Button>
          </div>
          <div className="rounded-3xl border bg-card p-5">
            <p className="text-sm font-medium">Health check</p>
            <p className="text-xs text-muted-foreground">Signals to watch today.</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p>• {archivedCustomers.length} customers archived</p>
              <p>• {(summary?.count ?? 0) - reconciledCount} transactions unreconciled</p>
              <p>• {recentIncome.length} income entries in the last sync</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Recent customers</p>
            <Badge variant="outline">{activeCustomers.length} active</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {recentCustomers.length ? (
              recentCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.email ?? "No email"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {customer.contact_person ?? "—"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No customers yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Recent income</p>
            <Badge variant="outline">{summary?.count ?? 0} entries</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {recentIncome.length ? (
              recentIncome.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(income.received_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {income.reference ?? "No reference"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {currencyFormatter.format(income.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No income yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
