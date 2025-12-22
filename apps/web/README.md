# Creda Web

## Local setup

```bash
cd apps/web
bun install
bun dev
```

## Environment

Required:
- `NEXT_PUBLIC_API_URL`

Optional:
- `NEXT_PUBLIC_ENABLE_ANALYTICS=true` (Umami events)

## Notes

- Umami script loads only in production and when analytics are enabled.
- The app expects API auth cookies from the FastAPI backend.
