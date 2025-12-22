# Creda API

## Local setup

```bash
cd apps/api
cp sample.env .env
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment

Required:
- `DATABASE_URL`, `DATABASE_NAME`
- `JWT_SECRET_KEY`, `PASSWORDS_SALT_SECRET_KEY`
- `API_BASE_URL`, `FRONTEND_URL`

Optional:
- `SMTP_*` (email)
- `SENTRY_*` (errors + performance)
- `METRICS_TOKEN` (protects `/metrics`)

## Endpoints

- API base: `http://localhost:8000`
- Health check: `GET /health`
- Metrics: `GET /metrics` (requires token if set)
