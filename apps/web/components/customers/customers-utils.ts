import type { Customer, FormState } from "@/components/customers/customers-types"

export function getFormStateFromCustomer(customer: Customer): FormState {
  return {
    name: customer.name ?? "",
    email: customer.email ?? "",
    billing_email: customer.billing_email ?? "",
    phone: customer.phone ?? "",
    website: customer.website ?? "",
    contact_person: customer.contact_person ?? "",
    address_line1: customer.address?.line1 ?? "",
    address_line2: customer.address?.line2 ?? "",
    address_city: customer.address?.city ?? "",
    address_county: customer.address?.county ?? "",
    address_postcode: customer.address?.postcode ?? "",
    address_country: customer.address?.country ?? "",
    expense_tags: customer.expense_tags?.join(", ") ?? "",
    tax_id: customer.tax_id ?? "",
    note: customer.note ?? "",
  }
}

export function normalizeOptional(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function buildPayload(formState: FormState) {
  const addressFields = {
    line1: normalizeOptional(formState.address_line1),
    line2: normalizeOptional(formState.address_line2),
    city: normalizeOptional(formState.address_city),
    county: normalizeOptional(formState.address_county),
    postcode: normalizeOptional(formState.address_postcode),
    country: normalizeOptional(formState.address_country),
  }

  const hasAddress = Object.values(addressFields).some((value) => value)

  return {
    name: formState.name.trim(),
    email: normalizeOptional(formState.email),
    billing_email: normalizeOptional(formState.billing_email),
    phone: normalizeOptional(formState.phone),
    website: normalizeOptional(formState.website),
    contact_person: normalizeOptional(formState.contact_person),
    address: hasAddress ? addressFields : null,
    expense_tags: formState.expense_tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    tax_id: normalizeOptional(formState.tax_id),
    note: normalizeOptional(formState.note),
  }
}

export function getSearchableText(customer: Customer) {
  const address = customer.address ?? {}

  return [
    customer.name,
    customer.email,
    customer.billing_email,
    customer.contact_person,
    customer.phone,
    customer.website,
    customer.tax_id,
    customer.note,
    address.line1,
    address.line2,
    address.city,
    address.county,
    address.postcode,
    address.country,
    ...(customer.expense_tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
