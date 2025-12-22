# Creda

Creda is a personal income, invoicing, and relationship tracking system.

It is designed for individuals or small businesses who:
- have a mix of payroll and freelance income
- want clean, accurate invoices
- want to understand *who* pays them, *how much*, and *when*
- don’t want a full accounting system or sales CRM

Creda starts as a personal tool and is built to evolve into a SaaS product over time.

---

## Core idea

Creda tracks **money received** independently of invoices. Invoices are documents that can be public, emailed, and marked paid. When an invoice is marked as paid, Creda can automatically create a matching income transaction.

This keeps the system honest:
- invoices describe *intent to bill*
- income describes *actual money received*

---

## What’s in scope (current)

- People & organizations (CRM-like)
- Income tracking (payroll + freelance + manual)
- Invoicing (document-style editor + public share links)
- Workspace concept (single active workspace, switch UI ready)
- Dashboard overview with live data
- Settings dialog (profile + account)
- Basic observability

Out of scope (for now):
- Accounting
- Tax automation
- Sales pipelines
- Subscriptions
- Bank syncing
- Expense tracking
- Payments processing (Stripe, etc)

---

## Architecture

This is a monorepo:
```
apps/
    web/ – Next.js frontend
    api/ – FastAPI backend
```

- Frontend: Next.js
- Backend: FastAPI
- Database: MongoDB
- Auth: email-based (session cookie)

The frontend and backend are intentionally decoupled and communicate via HTTP APIs.

---

## Observability

### Sentry (API errors + performance)
Configured in the API service. Set these env vars:
- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_ENVIRONMENT`

### Prometheus metrics (API)
Prometheus metrics exposed at `/metrics`. Protected by a token:
- `METRICS_TOKEN` (use `X-Metrics-Token` or `Authorization: Bearer`)

Use Prometheus or Grafana Agent/Alloy to scrape `/metrics`, then point Grafana at the Prometheus server.

### Grafana
- Add a Prometheus datasource (pointed at your Prometheus server, not `/metrics` directly).
- Import the dashboard JSON provided in chat for a starter layout.

### Umami (web analytics)
The web app loads Umami only in production **and** when enabled:
- `NEXT_PUBLIC_ENABLE_ANALYTICS=true`

---

## Deployments

### Web (Next.js)
Build args:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ENABLE_ANALYTICS`

### API (FastAPI)
Environment:
- `API_BASE_URL`
- `FRONTEND_URL` (used for public invoice links)
- SMTP settings (email)
- Sentry + metrics settings (above)

### Docker Compose
See `docker-compose.yml` for the base deployment wiring. The `web` build uses the API URL and analytics flag at build time.

---

## Local setup

### API (apps/api)
```
cd apps/api
cp sample.env .env
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Key envs in `.env`:
- `DATABASE_URL`, `DATABASE_NAME`
- `JWT_SECRET_KEY`, `PASSWORDS_SALT_SECRET_KEY`
- `API_BASE_URL`, `FRONTEND_URL`
- `SMTP_*`
- `SENTRY_*` (optional)
- `METRICS_TOKEN` (optional)

### Web (apps/web)
```
cd apps/web
pnpm install
pnpm dev
```

Key envs (set via `.env.local` or shell):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ENABLE_ANALYTICS`

---

## Status

Creda is under active development and not yet production-ready, therefore I do use it myself.  
Hosted version are available but not guaranteed stable.

Expect:
- breaking changes
- incomplete features
- rapid iteration

---

## License

TBD
