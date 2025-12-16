# Zembro Production Deployment Guide

This document explains how to deploy Zembro to production using Vercel (web), Railway (API + worker), and Supabase (database).

## Architecture

- **Web**: Next.js app (`/web`) → Vercel
- **API**: Node.js/Express (`src/httpServer.ts`) → Railway
- **Worker**: Node.js job runner (`src/worker.ts`) → Railway worker service
- **DB**: Supabase Postgres (managed)

---

## 1. Services & Entrypoints

- **Web**: `/web` (Next.js)
- **API**: `/src/index.ts` (calls `startHttpServer` from `/src/httpServer.ts`)
- **Worker**: `/src/worker.ts`

---

## 2. Environment Variables

### API/Worker (Railway)
- NODE_ENV=production
- PORT=3001 (or as set by Railway)
- APP_URL=https://app.zembro.co.uk
- API_URL=https://api.zembro.co.uk
- DATABASE_URL=... (Supabase pooler)
- DIRECT_URL=... (Supabase direct)
- OPENAI_API_KEY=...
- OPENAI_TED_MODEL=...
- SERPER_API_KEY=...
- STRIPE_SECRET_KEY=...
- STRIPE_WEBHOOK_SECRET=...
- STRIPE_PRICE_STARTER=...
- STRIPE_PRICE_GROWTH=...
- STRIPE_PRICE_SCALE=...
- STRIPE_PRICE_5K_CREDITS=...
- STRIPE_PRICE_20K_CREDITS=...
- SUPABASE_URL=...
- SUPABASE_ANON_KEY=...
- SUPABASE_SERVICE_ROLE_KEY=...

### Web (Vercel)
- NEXT_PUBLIC_API_BASE_URL=https://api.zembro.co.uk
- NEXT_PUBLIC_APP_URL=https://app.zembro.co.uk
- NEXT_PUBLIC_SUPABASE_URL=...
- NEXT_PUBLIC_SUPABASE_ANON_KEY=...

---

## 3. Build & Start Commands

### API
- Build: `npm run build`
- Start: `npm run start`


### Worker
- Build: `npm run build`
- Start: `npm run worker:start`
- To scale concurrency: set `WORKER_CONCURRENCY` env var (e.g. `WORKER_CONCURRENCY=4 npm run worker:start`)
- To scale horizontally: run multiple worker services on Railway

### Web
- Build: `npm run build`
- Start: `npm run start`

---

## 4. Stripe Webhook

Set Stripe webhook URL to:
```
https://api.zembro.co.uk/webhooks/stripe
```

---

## 5. Health Checks

- API: `GET https://api.zembro.co.uk/health`
- Worker: `GET https://api.zembro.co.uk/worker-health` (or as configured)

---

## 6. Testing Production

- Deploy all services
- Run a real lead search in the web app
- Confirm jobs are processed by the worker
- Test TED tool calls
- Test Stripe webhooks (purchase credits, etc.)

---

## 7. Notes & TODOs

- Rate limiting, queue scaling, and caching are not yet enabled (future work)
- Ensure all env vars are set in Railway/Vercel dashboards
- For any issues, check logs in Railway/Vercel

---

## Quick Smoke Test (Local)

See `scripts/smokeProd.sh` for a local production-mode test script.

---

For questions, contact the Zembro team.
