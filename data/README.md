# Local Data

This app is designed to avoid live third-party data calls at page load.

## Reactors

`data/reactors.local.json` is a small, normalized reactor dataset used as a fallback when Supabase
is not configured (or is unavailable).

Shape: `lib/reactors/types.ts`

Notes:
- This file is intentionally small today so the map and directory are never blank in local/dev.
- The long-term plan is to replace/augment this file via a scheduled ETL job that ingests PRIS/WNA
  and writes into the local database.

## News

News is ingested on a schedule and stored locally in `data/news.local.json`.

Vercel Cron hits `/api/etl/news/sync` every ~3 hours (see `vercel.json`).

To lock down ingestion in production, set `CRON_SECRET`. Vercel Cron will send it in an
`Authorization: Bearer <CRON_SECRET>` header.
