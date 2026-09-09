# Deploying to abscreations.eu/cnc

This app runs as two Docker containers on the abscreations.eu VPS, following the
same pattern as the other apps on that host (`elesko-app`, `databridge-postgres`,
etc.): a dedicated Postgres container, an app container built from the
`Dockerfile` here, and a Caddy `handle` block that reverse-proxies `/cnc/*` to
the app container's published port.

## One-time server setup

```bash
mkdir -p /var/www/capaciti
cd /var/www/capaciti
git clone <repo-url> .   # or rsync the working tree
cp .env.production.example .env
# edit .env: real POSTGRES_PASSWORD, SESSION_SECRET, confirm APP_PORT is free
docker compose up -d --build
docker compose exec app npm run db:seed   # optional demo data
```

Then add to `/etc/caddy/Caddyfile`, inside the `abscreations.eu { ... }` block,
alongside the other `@name path ...` handlers (must come before the final
catch-all `handle { root * /var/www/abscreations ... }`):

```caddyfile
@cnc path /cnc /cnc/*
handle @cnc {
	reverse_proxy 127.0.0.1:8102 {
		header_up X-Forwarded-For {remote_host}
		header_up X-Forwarded-Proto https
	}
}
```

`8102` must match `APP_PORT` in `.env`. Reload (not restart) Caddy so other
sites are unaffected:

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

## Updating an existing deployment

```bash
cd /var/www/capaciti
git pull
docker compose up -d --build
```

`prisma migrate deploy` runs automatically on container start (see
`Dockerfile`'s `CMD`), so schema changes apply on every deploy without a
separate step.

## Notes

- `NEXT_PUBLIC_BASE_PATH=/cnc` bakes the subpath into the Next.js build
  (`next.config.mjs`'s `basePath`) — Caddy forwards the `/cnc` prefix as-is
  rather than stripping it, so the app must know it lives under that prefix.
- Uploaded RFQ files live in the `capaciti-uploads` Docker volume, not inside
  the container, so they survive `docker compose up -d --build`.
- The Postgres container has no host port published — only the app container
  can reach it, over the compose-internal network.
