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
  received_at: string
  is_reconciled: boolean
}

type LoadState = "idle" | "loading" | "error" | "ready"

export function DashboardOverview() {
  const router = useRouter()
  const [activeCustomers, setActiveCustomers] = useState<CustomerListItem[]>([])
  const [archivedCustomers, setArchivedCustomers] = useState<CustomerListItem[]>([])
  const [incomes, setIncomes] = useState<IncomeListItem[]>([])
  const [loadState, setLoadState] = useState<LoadState>("idle")

  useEffect(() => {
    async function loadStats() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setLoadState("error")
        return
      }

      setLoadState("loading")

      const [activeRes, archivedRes, incomeRes] = await Promise.all([
        fetch(`${API_URL}/api/private/identity/?archived=false`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/private/identity/?archived=true`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/private/income/`, {
          credentials: "include",
        }),
      ])

      if ([activeRes, archivedRes, incomeRes].some((res) => res.status === 401)) {
        router.push("/signin")
        return
      }

      if (![activeRes, archivedRes, incomeRes].every((res) => res.ok)) {
        setLoadState("error")
        return
      }

      const [activeData, archivedData, incomeData] =
        (await Promise.all([
          activeRes.json(),
          archivedRes.json(),
          incomeRes.json(),
        ])) as [CustomerListItem[], CustomerListItem[], IncomeListItem[]]

      setActiveCustomers(activeData)
      setArchivedCustomers(archivedData)
      setIncomes(incomeData)
      setLoadState("ready")
    }

    loadStats()
  }, [router])

  const totalCustomers = activeCustomers.length + archivedCustomers.length
  const reconciledCount = incomes.filter((income) => income.is_reconciled).length
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)

  const monthIncome = useMemo(() => {
    const now = new Date()
    return incomes
      .filter((income) => {
        const date = new Date(income.received_at)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      })
      .reduce((sum, income) => sum + income.amount, 0)
  }, [incomes])

  const incomeBars = useMemo(() => {
    const recent = incomes
      .slice(0, 10)
      .map((income) => income.amount)
    const max = Math.max(...recent, 1)
    return recent.map((amount) => Math.round((amount / max) * 100))
  }, [incomes])

  const recentCustomers = activeCustomers.slice(0, 5)
  const recentIncome = incomes.slice(0, 6)

  const statusBadge = (() => {
    if (loadState === "loading") return "Loading…"
    if (loadState === "error") return "Unavailable"
    return `${activeCustomers.length} active`
  })()

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
            <div className="grid gap-3 md:grid-cols-3">
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
                  {incomes.length - reconciledCount} pending
                </p>
              </div>
            </div>
            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Income pulse</p>
                <span className="text-xs text-muted-foreground">Last 10 entries</span>
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
            <Button variant="outline" size="sm" className="mt-4 w-full">
              View reports
            </Button>
          </div>
          <div className="rounded-3xl border bg-card p-5">
            <p className="text-sm font-medium">Health check</p>
            <p className="text-xs text-muted-foreground">Signals to watch today.</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p>• {archivedCustomers.length} customers archived</p>
              <p>• {incomes.length - reconciledCount} transactions unreconciled</p>
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
            <Badge variant="outline">{incomes.length} entries</Badge>
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
