import fs from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';

// Usage:
//   node scripts/ingest/enrich_coords_from_wri_powerplants.mjs \
//     data/reactors.json data/sources/global_power_plant_database.csv data/reactors.json
//
// This is an offline, local-only enrichment step:
// - reads the app's normalized reactor list
// - reads WRI Global Power Plant Database CSV (or a compatible export)
// - matches nuclear plants by country + name (normalized)
// - fills missing lat/lng
//
// It does not call any external services and is safe for your "no third-party calls at page load" rule.

function asString(v) {
  return v == null ? '' : String(v).trim();
}

function asNumber(v) {
  const s = asString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function norm(s) {
  return asString(s)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normCountry(s) {
  const n = norm(s);
  // Common WRI vs IAEA naming differences.
  const aliases = new Map([
    ['united states', 'united states of america'],
    ['usa', 'united states of america'],
    ['uk', 'united kingdom'],
    ['russia', 'russian federation'],
    ['south korea', 'korea republic of'],
    ['north korea', 'korea democratic peoples republic of'],
    ['iran', 'iran islamic republic of'],
    ['laos', 'lao peoples democratic republic'],
    ['syria', 'syrian arab republic'],
    ['venezuela', 'venezuela bolivarian republic of'],
    ['tanzania', 'tanzania united republic of'],
    ['bolivia', 'bolivia plurinational state of'],
    ['moldova', 'moldova republic of'],
    ['vietnam', 'viet nam'],
    ['brunei', 'brunei darussalam'],
    ['czech republic', 'czechia'],
    ['uae', 'united arab emirates'],
  ]);
  return aliases.get(n) || n;
}

function tokens(s) {
  return norm(s).split(' ').filter(Boolean);
}

function scoreMatch(aTokens, bTokens) {
  // simple overlap score (0..1)
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const denom = Math.max(a.size, b.size);
  return inter / denom;
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(path.resolve(p), 'utf8'));
}

async function main() {
  const [reactorsPath, wriCsvPath, outPath] = process.argv.slice(2);
  if (!reactorsPath || !wriCsvPath || !outPath) {
    console.error(
      'Usage: node scripts/ingest/enrich_coords_from_wri_powerplants.mjs <reactors.json> <wri.csv> <out.json>'
    );
    process.exit(2);
  }

  const reactors = await readJson(reactorsPath);
  const overridesPath = path.join(process.cwd(), 'data', 'overrides', 'reactor_coords.overrides.json');
  let overrides = {};
  try {
    overrides = await readJson(overridesPath);
  } catch {
    // optional
  }

  const csv = await fs.readFile(path.resolve(wriCsvPath), 'utf8');
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.error('CSV parse errors:', parsed.errors.slice(0, 3));
    process.exit(1);
  }

  const rows = parsed.data || [];
  const nuclear = rows.filter((r) => norm(r.primary_fuel || r.fuel1 || r.fuel) === 'nuclear');

  // Index WRI plants by normalized country + name tokens.
  const wriIndex = nuclear.map((r) => {
    const country = asString(r.country_long || r.country || r.country_name);
    const name = asString(r.name || r.plant_name || r.plant);
    return {
      country,
      name,
      t: tokens(name),
      lat: asNumber(r.latitude),
      lng: asNumber(r.longitude),
    };
  });

  let filled = 0;
  let overridden = 0;
  let unmatched = 0;

  const out = reactors.map((r) => {
    const ov = overrides[r.id];
    if (ov && typeof ov.lat === 'number' && typeof ov.lng === 'number') {
      overridden++;
      return { ...r, lat: ov.lat, lng: ov.lng };
    }

    if (typeof r.lat === 'number' && typeof r.lng === 'number') return r;

    const rt = tokens(r.plant || r.name);
    const rc = normCountry(r.country);
    const candidates = wriIndex.filter((p) => normCountry(p.country) === rc);
    let best = null;
    let bestScore = 0;
    let secondBest = 0;
    for (const c of candidates) {
      const s = scoreMatch(rt, c.t);
      if (s > bestScore) {
        secondBest = bestScore;
        bestScore = s;
        best = c;
      } else if (s > secondBest) {
        secondBest = s;
      }
    }

    // Avoid noisy matches: require a clear winner.
    const isClearWinner = bestScore >= 0.5 && bestScore - secondBest >= 0.15;
    if (best && isClearWinner && best.lat != null && best.lng != null) {
      filled++;
      return { ...r, lat: best.lat, lng: best.lng, source: `${r.source} + WRI GPPD (coords)` };
    }

    unmatched++;
    return r;
  });

  await fs.writeFile(path.resolve(outPath), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(
    `Enriched coords: filled=${filled}, overridden=${overridden}, unmatched=${unmatched}, total=${out.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
