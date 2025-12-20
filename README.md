# Creda

Creda is a personal income, invoicing, and relationship tracking system.

It is designed for individuals who:
- have a mix of payroll and freelance income
- want clean, accurate invoices
- want to understand *who* pays them, *how much*, and *when*
- don’t want a full accounting system or sales CRM

Creda starts as a personal tool and is built to evolve into a SaaS product over time.

---

## Scope (current)

- People & organizations (CRM-like)
- Income tracking (payroll + freelance)
- Invoicing (Remit engine)
- Clear income timeline

Out of scope (for now):
- Accounting
- Tax automation
- Sales pipelines
- Subscriptions
- Bank syncing

---

## Architecture

This is a monorepo:
```
apps/
    web/ – Next.js frontend
    api/ – FastAPI backend
```

- Frontend: Next.js (App Router)
- Backend: FastAPI
- Database: MongoDB
- Auth: email-based (planned)

The frontend and backend are intentionally decoupled and communicate via HTTP APIs.

---

## Status

Creda is under active development and not yet production-ready.

Expect:
- breaking changes
- incomplete features
- rapid iteration

---

## License

TBD
