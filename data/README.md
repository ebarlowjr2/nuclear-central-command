# Local Data

This app is designed to avoid live third-party data calls at page load.

## Reactors

`data/reactors.json` is the app's local, normalized reactor dataset.

Shape: `lib/reactors/types.ts`

Notes:
- This file is intentionally small today so the map and directory are never blank.
- To upgrade to a full PRIS export, place the PRIS CSV at `data/sources/pris.csv` and run:
  `node scripts/ingest/pris_csv_to_reactors.mjs data/sources/pris.csv data/reactors.json`

## News

News is ingested on a schedule and stored locally in `data/news.local.json`.

Vercel Cron hits `/api/etl/news/sync` every ~3 hours (see `vercel.json`).

To lock down ingestion in production, set `CRON_SECRET`. Vercel Cron will send it in an
`Authorization: Bearer <CRON_SECRET>` header.
