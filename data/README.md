# Local Data

This app is designed to avoid live third-party data calls at page load.

## Reactors

`data/reactors.json` is the app's local, normalized reactor dataset.

Shape: `lib/reactors/types.ts`

Notes:
- This file is intentionally small today so the map and directory are never blank.
- To upgrade to a full PRIS export, place the PRIS CSV at `data/sources/pris.csv` and run:
  `node scripts/ingest/pris_csv_to_reactors.mjs data/sources/pris.csv data/reactors.json`

Alternative (no local Node script):
- POST a PRIS CSV to `/api/etl/pris/normalize` and download the returned JSON. This endpoint requires
  `CRON_SECRET` and accepts `Authorization: Bearer <CRON_SECRET>` or `?secret=...`.

### Coordinates (lat/lng)

RDS-2 tables often omit coordinates. To enrich coordinates offline:
- Download the WRI Global Power Plant Database CSV and save it as `data/sources/global_power_plant_database.csv`
- Run:
  `node scripts/ingest/enrich_coords_from_wri_powerplants.mjs data/reactors.json data/sources/global_power_plant_database.csv data/reactors.json`
- For manual fixes, edit `data/overrides/reactor_coords.overrides.json`

## News

News is stored locally in `data/news.json` and served at page load without third-party calls.

In production, the recommended workflow is an offline sync (GitHub Actions) that:
- fetches RSS feeds
- dedupes + tags
- writes `data/news.json`
- commits the update so Vercel deploys the fresh data
