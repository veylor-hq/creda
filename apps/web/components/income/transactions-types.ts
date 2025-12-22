export type IncomeSourceType = "bank_transfer" | "payroll" | "cash" | "manual"

export type IncomeTransaction = {
  id: string
  person_id: string
  invoice_id?: string | null
  amount: number
  currency: string
  source_type: IncomeSourceType
  reference?: string | null
  received_at: string
  notes?: string | null
  tags?: string[]
  is_reconciled: boolean
  is_archived?: boolean
}

export type PersonSummary = {
  id: string
  name: string
  email?: string | null
}

export type FormState = {
  person_id: string
  invoice_id: string
  amount: string
  currency: string
  source_type: IncomeSourceType
  reference: string
  received_at: string
  notes: string
  tags: string
  is_reconciled: boolean
}

export type TransactionListItem = {
  id: string
  person_id: string
  invoice_id?: string | null
  amount: number
  currency: string
  source_type: IncomeSourceType
  reference?: string | null
  received_at: string
  is_reconciled: boolean
}

export type InvoiceSummary = {
  id: string
  person_id: string
  number: string
  status: "draft" | "issued" | "paid" | "canceled"
  total: number
  currency: string
  issue_date: string
  due_date: string
}

export type LoadState = "idle" | "loading" | "error" | "ready"
