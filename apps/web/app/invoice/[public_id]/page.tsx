"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import type { Invoice } from "@/components/invoices/invoices-types"
import { formatCurrency } from "@/components/invoices/invoices-utils"

export default function PublicInvoicePage() {
  const params = useParams()
  const publicId = params?.public_id as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    async function loadInvoice() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL

      if (!API_URL || !publicId) {
        setStatus("error")
        return
      }

      const res = await fetch(`${API_URL}/api/public/invoice/${publicId}`)

      if (!res.ok) {
        setStatus("error")
        return
      }

      const data = (await res.json()) as Invoice
      setInvoice(data)
      setStatus("ready")
    }

    loadInvoice()
  }, [publicId])

  const currency = invoice?.currency ?? "GBP"

  const totals = useMemo(() => {
    if (!invoice) {
      return { subtotal: 0, tax_amount: 0, total: 0 }
    }
    return {
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
    }
  }, [invoice])

  if (status === "error") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-medium">Invoice not found</p>
        <p className="text-sm text-muted-foreground">
          The invoice is not public or no longer exists.
        </p>
      </div>
    )
  }

  if (status === "loading" || !invoice) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading invoice…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="rounded-3xl border bg-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Invoice
            </p>
            <p className="mt-2 text-2xl font-semibold">{invoice.number}</p>
            <p className="text-sm text-muted-foreground">
              Issued {new Date(invoice.issue_date).toLocaleDateString("en-GB")}
            </p>
          </div>
          <Badge variant="outline">{invoice.status}</Badge>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Bill to</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Customer ID: {invoice.person_id}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Due date</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date(invoice.due_date).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatCurrency(item.unit_price, currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(item.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs rounded-2xl border bg-background/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(totals.tax_amount, currency)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totals.total, currency)}</span>
            </div>
          </div>
        </div>
        {invoice.notes && (
          <div className="mt-6">
            <p className="text-sm font-medium">Notes</p>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </div>
        )}
        {invoice.payment_details && (
          <div className="mt-6">
            <p className="text-sm font-medium">Payment details</p>
            <p className="text-sm text-muted-foreground">
              {invoice.payment_details}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
