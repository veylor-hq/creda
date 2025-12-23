"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"

type IncomeSummary = {
  count: number
  total_amount: number
  reconciled_count: number
}

type IncomeItem = {
  id: string
  amount: number
  currency: string
  reference?: string | null
  received_at: string
}

type IncomeListResponse = {
  items: IncomeItem[]
}

type CustomerIncomePanelProps = {
  personId: string
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
})

export function CustomerIncomePanel({ personId }: CustomerIncomePanelProps) {
  const router = useRouter()
  const [summary, setSummary] = useState<IncomeSummary | null>(null)
  const [items, setItems] = useState<IncomeItem[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">(
    "idle"
  )

  useEffect(() => {
    async function loadIncome() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL) {
        setStatus("error")
        return
      }

      setStatus("loading")

      const params = new URLSearchParams({
        person_id: personId,
        page: "1",
        page_size: "5",
        sort_by: "received_at",
        sort_dir: "desc",
        status: "received",
      })

      const [summaryRes, listRes] = await Promise.all([
        fetch(`${API_URL}/api/private/income/summary?person_id=${personId}&status=received`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/private/income/?${params.toString()}`, {
          credentials: "include",
        }),
      ])

      if ([summaryRes, listRes].some((res) => res.status === 401)) {
        router.push("/signin")
        return
      }

      if (![summaryRes, listRes].every((res) => res.ok)) {
        setStatus("error")
        return
      }

      const [summaryData, listData] = (await Promise.all([
        summaryRes.json(),
        listRes.json(),
      ])) as [IncomeSummary, IncomeListResponse]

      setSummary(summaryData)
      setItems(listData.items)
      setStatus("ready")
    }

    loadIncome()
  }, [personId, router])

  if (status === "error") {
    return (
      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-sm font-medium">Income history</p>
        <p className="text-xs text-destructive">Failed to load income data.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Income history</p>
          <p className="text-xs text-muted-foreground">
            Latest payments and totals for this customer.
          </p>
        </div>
        <Badge variant="outline">
          {status === "loading" ? "Loading…" : `${summary?.count ?? 0} entries`}
        </Badge>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border bg-background/60 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Total received</p>
          <p className="mt-1 text-base font-semibold">
            {status === "ready" ? currencyFormatter.format(summary?.total_amount ?? 0) : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-background/60 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Reconciled</p>
          <p className="mt-1 text-base font-semibold">
            {status === "ready" ? summary?.reconciled_count ?? 0 : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-background/60 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Latest payment</p>
          <p className="mt-1 text-base font-semibold">
            {items[0]
              ? currencyFormatter.format(items[0].amount)
              : "—"}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {new Date(income.received_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {income.reference ?? "No reference"}
                </p>
              </div>
              <span className="font-medium">
                {currencyFormatter.format(income.amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">
            {status === "loading" ? "Loading income…" : "No income yet."}
          </p>
        )}
      </div>
    </div>
  )
}
