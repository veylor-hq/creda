import type { Invoice, InvoiceFormState, InvoiceLineItem } from "@/components/invoices/invoices-types"

export const emptyInvoiceForm: InvoiceFormState = {
  person_id: "",
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: new Date().toISOString().slice(0, 10),
  currency: "GBP",
  status: "draft",
  tax_rate: "0",
  notes: "",
  payment_details: "",
  is_public: false,
  send_email: false,
  items: [{ description: "", quantity: "1", unit_price: "0" }],
}

export function toInvoiceForm(invoice?: Invoice): InvoiceFormState {
  if (!invoice) {
    return { ...emptyInvoiceForm }
  }

  return {
    person_id: invoice.person_id,
    issue_date: invoice.issue_date.slice(0, 10),
    due_date: invoice.due_date.slice(0, 10),
    currency: invoice.currency,
    status: invoice.status,
    tax_rate: invoice.tax_rate.toString(),
    notes: invoice.notes ?? "",
    payment_details: invoice.payment_details ?? "",
    is_public: invoice.is_public,
    send_email: false,
    items: invoice.items.length
      ? invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
        }))
      : [{ description: "", quantity: "1", unit_price: "0" }],
  }
}

export function computeLineItems(items: InvoiceFormState["items"]): InvoiceLineItem[] {
  return items
    .filter((item) => item.description.trim())
    .map((item) => {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unit_price) || 0
      return {
        description: item.description,
        quantity,
        unit_price: unitPrice,
        total: quantity * unitPrice,
      }
    })
}

export function computeTotals(items: InvoiceLineItem[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount
  return { subtotal, taxAmount, total }
}

export function buildInvoicePayload(form: InvoiceFormState) {
  return {
    person_id: form.person_id,
    currency: form.currency,
    issue_date: new Date(form.issue_date).toISOString(),
    due_date: new Date(form.due_date).toISOString(),
    items: form.items
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      })),
    notes: form.notes.trim() || null,
    payment_details: form.payment_details.trim() || null,
    tax_rate: Number(form.tax_rate) || 0,
    status: form.status,
    is_public: form.is_public,
    send_email: form.send_email,
  }
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
