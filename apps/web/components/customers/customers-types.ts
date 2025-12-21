import type { ReactNode } from "react"

export type Address = {
  line1?: string | null
  line2?: string | null
  city?: string | null
  county?: string | null
  postcode?: string | null
  country?: string | null
}

export type Customer = {
  id: string
  name: string
  email?: string | null
  contact_person?: string | null
  is_archived?: boolean
  billing_email?: string | null
  phone?: string | null
  website?: string | null
  address?: Address | null
  expense_tags?: string[]
  tax_id?: string | null
  note?: string | null
  created_at?: string
}

export type FormState = {
  name: string
  email: string
  billing_email: string
  phone: string
  website: string
  contact_person: string
  address_line1: string
  address_line2: string
  address_city: string
  address_county: string
  address_postcode: string
  address_country: string
  expense_tags: string
  tax_id: string
  note: string
}

export type LoadState = {
  status: "idle" | "loading" | "error" | "ready"
  message?: string
}

export type Column = {
  id: string
  label: string
  cellClassName?: string
  render: (customer: Customer) => ReactNode
}

export type SortKey = "name" | "created_at" | "email"

export type SortDirection = "asc" | "desc"
