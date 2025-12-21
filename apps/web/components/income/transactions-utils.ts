import type { FormState, IncomeTransaction, TransactionListItem } from "@/components/income/transactions-types"

export const emptyFormState: FormState = {
  person_id: "",
  amount: "",
  currency: "GBP",
  source_type: "bank_transfer",
  reference: "",
  received_at: "",
  notes: "",
  tags: "",
  is_reconciled: false,
}

export function toFormState(transaction?: IncomeTransaction): FormState {
  if (!transaction) {
    return { ...emptyFormState }
  }

  return {
    person_id: transaction.person_id,
    amount: transaction.amount.toString(),
    currency: transaction.currency,
    source_type: transaction.source_type,
    reference: transaction.reference ?? "",
    received_at: transaction.received_at.slice(0, 10),
    notes: transaction.notes ?? "",
    tags: transaction.tags?.join(", ") ?? "",
    is_reconciled: transaction.is_reconciled,
  }
}

export function buildPayload(form: FormState) {
  return {
    person_id: form.person_id,
    amount: Number(form.amount),
    currency: form.currency,
    source_type: form.source_type,
    reference: form.reference.trim() || null,
    received_at: new Date(form.received_at).toISOString(),
    notes: form.notes.trim() || null,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    is_reconciled: form.is_reconciled,
  }
}

export function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function normalizeListItem(item: TransactionListItem): IncomeTransaction {
  return {
    ...item,
    received_at: item.received_at,
  }
}
