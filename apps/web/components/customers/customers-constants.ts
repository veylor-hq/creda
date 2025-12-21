import type { Column, FormState, SortKey } from "@/components/customers/customers-types"

export const columns: Column[] = [
  {
    id: "name",
    label: "Customer",
    render: (customer) => customer.name,
    cellClassName: "font-medium text-foreground",
  },
  {
    id: "email",
    label: "Email",
    render: (customer) => customer.email ?? "—",
  },
  {
    id: "contact_person",
    label: "Contact",
    render: (customer) => customer.contact_person ?? "—",
  },
  {
    id: "billing_email",
    label: "Billing",
    render: (customer) => customer.billing_email ?? "—",
  },
  {
    id: "phone",
    label: "Phone",
    render: (customer) => customer.phone ?? "—",
  },
  {
    id: "website",
    label: "Website",
    render: (customer) => customer.website ?? "—",
  },
  {
    id: "address_line1",
    label: "Address 1",
    render: (customer) => customer.address?.line1 ?? "—",
  },
  {
    id: "address_line2",
    label: "Address 2",
    render: (customer) => customer.address?.line2 ?? "—",
  },
  {
    id: "address_city",
    label: "City",
    render: (customer) => customer.address?.city ?? "—",
  },
  {
    id: "address_county",
    label: "County",
    render: (customer) => customer.address?.county ?? "—",
  },
  {
    id: "address_postcode",
    label: "Postcode",
    render: (customer) => customer.address?.postcode ?? "—",
  },
  {
    id: "address_country",
    label: "Country",
    render: (customer) => customer.address?.country ?? "—",
  },
  {
    id: "expense_tags",
    label: "Tags",
    render: (customer) =>
      customer.expense_tags?.length ? customer.expense_tags.join(", ") : "—",
  },
  {
    id: "tax_id",
    label: "Tax ID",
    render: (customer) => customer.tax_id ?? "—",
  },
  {
    id: "note",
    label: "Note",
    render: (customer) => customer.note ?? "—",
  },
  {
    id: "created_at",
    label: "Created",
    render: (customer) =>
      customer.created_at
        ? new Date(customer.created_at).toLocaleDateString()
        : "—",
  },
]

export const sortOptions: Array<{ id: SortKey; label: string }> = [
  { id: "name", label: "Name" },
  { id: "created_at", label: "Created" },
  { id: "email", label: "Email" },
]

export const visibleColumnsStorageKey = "customers-table-visible-columns"

export const emptyFormState: FormState = {
  name: "",
  email: "",
  billing_email: "",
  phone: "",
  website: "",
  contact_person: "",
  address_line1: "",
  address_line2: "",
  address_city: "",
  address_county: "",
  address_postcode: "",
  address_country: "",
  expense_tags: "",
  tax_id: "",
  note: "",
}

export const formFields = Object.keys(emptyFormState) as Array<keyof FormState>
