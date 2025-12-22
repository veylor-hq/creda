export type InvoiceStatus = "draft" | "issued" | "paid" | "canceled"

export type InvoiceLineItem = {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export type Invoice = {
  id: string
  person_id: string
  number: string
  public_id: string
  status: InvoiceStatus
  currency: string
  issue_date: string
  due_date: string
  items: InvoiceLineItem[]
  notes?: string | null
  payment_details?: string | null
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
  is_public: boolean
}

export type InvoiceListItem = {
  id: string
  person_id: string
  number: string
  status: InvoiceStatus
  total: number
  currency: string
  issue_date: string
  due_date: string
  is_public: boolean
}

export type PersonSummary = {
  id: string
  name: string
  email?: string | null
}

export type InvoiceFormState = {
  person_id: string
  issue_date: string
  due_date: string
  currency: string
  status: InvoiceStatus
  tax_rate: string
  notes: string
  payment_details: string
  is_public: boolean
  send_email: boolean
  items: Array<{
    description: string
    quantity: string
    unit_price: string
  }>
}

export type InvoiceListResponse = {
  items: InvoiceListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}
