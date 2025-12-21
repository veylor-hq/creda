"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"

type DashboardStats = {
  customers: number
  activeCustomers: number
  deactivatedCustomers: number
}

type LoadState = "idle" | "loading" | "error" | "ready"

export function DashboardOverview() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("idle")

  useEffect(() => {
    async function loadStats() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setLoadState("error")
        return
      }

      setLoadState("loading")

      const [allRes, activeRes, archivedRes] = await Promise.all([
        fetch(`${API_URL}/api/private/identity/?include=details&archived=all`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/private/identity/?include=details&archived=false`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/private/identity/?include=details&archived=true`, {
          credentials: "include",
        }),
      ])

      if ([allRes, activeRes, archivedRes].some((res) => res.status === 401)) {
        router.push("/signin")
        return
      }

      if (![allRes, activeRes, archivedRes].every((res) => res.ok)) {
        setLoadState("error")
        return
      }

      const [allCustomers, activeCustomers, deactivatedCustomers] =
        (await Promise.all([
          allRes.json(),
          activeRes.json(),
          archivedRes.json(),
        ])) as [unknown[], unknown[], unknown[]]

      setStats({
        customers: allCustomers.length,
        activeCustomers: activeCustomers.length,
        deactivatedCustomers: deactivatedCustomers.length,
      })
      setLoadState("ready")
    }

    loadStats()
  }, [router])

  const statusLabel = useMemo(() => {
    if (loadState === "loading") {
      return "Loading…"
    }

    if (loadState === "error") {
      return "Unavailable"
    }

    if (!stats) {
      return "—"
    }

    return `${stats.activeCustomers} active`
  }, [loadState, stats])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Customers</p>
            <Badge variant="outline">{statusLabel}</Badge>
          </div>
          <div className="mt-4 text-3xl font-semibold">
            {stats?.customers ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            Total customer records in your workspace.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Active</p>
          <div className="mt-4 text-3xl font-semibold">
            {stats?.activeCustomers ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently active customers.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Deactivated</p>
          <div className="mt-4 text-3xl font-semibold">
            {stats?.deactivatedCustomers ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            Archived customers in the system.
          </p>
        </div>
      </div>
      <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
    </div>
  )
}
