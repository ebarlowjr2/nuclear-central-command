import fs from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';

// Usage:
//   node scripts/ingest/rds2_with_coords_merge.mjs \
//     data/sources/2024_Table14.csv data/sources/2024_Table13.csv data/sources/2024_Table12.csv \
//     data/sources/global_power_plant_database.csv \
//     data/reactors.json
//
// Merges RDS-2 reactor status tables (operating/UC/planned) and enriches coordinates using
// WRI Global Power Plant Database (nuclear plants), all offline.

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
function tokens(s) {
  return norm(s).split(' ').filter(Boolean);
}
function scoreMatch(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.max(a.size, b.size);
}
function pick(row, keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return row[k];
  }
  return null;
}
function titleCaseCountry(country) {
  return asString(country)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}
function parseRds2Csv(csvText) {
  const lines = csvText.split(/\r?\n/);
  const hasHeaderTop = lines[0]?.includes('Reactor Name') && lines[0]?.includes('Country') && lines[0]?.includes('Code');
  const chunk = hasHeaderTop ? csvText : lines.slice(4).join('\n');
  const parsed = Papa.parse(chunk, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) throw new Error(`CSV parse errors: ${parsed.errors[0].message}`);
  return parsed.data || [];
}

function convertRows(rows, status) {
  const nowIso = new Date().toISOString();
  return rows
    .map((row) => {
      const plant = asString(pick(row, ['Reactor Name']));
      const country = asString(pick(row, ['Country']));
      if (!plant || !country) return null;

      const code = asString(pick(row, ['Code']));
      const type = asString(pick(row, ['Type'])) || undefined;
      const model = asString(pick(row, ['Model'])) || undefined;
      const operator = asString(pick(row, ['Operator'])) || undefined;
      const net = asNumber(pick(row, ['_1', 'Net']));

      return {
        id: code ? `rds2-${code.replace(/\s+/g, '')}` : `rds2-${norm(country)}-${norm(plant)}`.slice(0, 80),
        name: plant,
        plant,
        country: titleCaseCountry(country),
        lat: null,
        lng: null,
        status,
        capacityMWe: net,
        type: type || model || undefined,
        operator,
        source: 'IAEA RDS-2 (PRIS-derived CSV)',
        lastUpdated: nowIso,
      };
    })
    .filter(Boolean);
}

async function main() {
  const [t14, t13, t12, wriCsv, outPath] = process.argv.slice(2);
  if (!t14 || !t13 || !t12 || !wriCsv || !outPath) {
    console.error(
      'Usage: node scripts/ingest/rds2_with_coords_merge.mjs <t14.csv> <t13.csv> <t12.csv> <wri.csv> <out.json>'
    );
    process.exit(2);
  }

  const [csv14, csv13, csv12, wriText] = await Promise.all([
    fs.readFile(path.resolve(t14), 'utf8'),
    fs.readFile(path.resolve(t13), 'utf8'),
    fs.readFile(path.resolve(t12), 'utf8'),
    fs.readFile(path.resolve(wriCsv), 'utf8'),
  ]);

  const r14 = convertRows(parseRds2Csv(csv14), 'operating');
  const r13 = convertRows(parseRds2Csv(csv13), 'under_construction');
  const r12 = convertRows(parseRds2Csv(csv12), 'planned');

  const merged = [...r14, ...r13, ...r12];

  const wriParsed = Papa.parse(wriText, { header: true, skipEmptyLines: true });
  if (wriParsed.errors?.length) throw new Error(`WRI parse errors: ${wriParsed.errors[0].message}`);
  const wriRows = wriParsed.data || [];
  const nuclear = wriRows
    .filter((r) => norm(r.primary_fuel || r.fuel1 || r.fuel) === 'nuclear')
    .map((r) => ({
      country: asString(r.country_long || r.country || r.country_name),
      name: asString(r.name || r.plant_name || r.plant),
      t: tokens(asString(r.name || r.plant_name || r.plant)),
      lat: asNumber(r.latitude),
      lng: asNumber(r.longitude),
    }))
    .filter((r) => r.country && r.name && r.lat != null && r.lng != null);

  let filled = 0;
  for (const r of merged) {
    const cand = nuclear.filter((p) => norm(p.country) === norm(r.country));
    const rt = tokens(r.plant || r.name);
    let best = null;
    let bestScore = 0;
    for (const c of cand) {
      const s = scoreMatch(rt, c.t);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    if (best && bestScore >= 0.6) {
      r.lat = best.lat;
      r.lng = best.lng;
      r.source = `${r.source} + WRI GPPD (coords)`;
      filled++;
    }
  }

  // Deduplicate by id and sort for stable diffs.
  const byId = new Map();
  for (const r of merged) byId.set(r.id, r);
  const out = Array.from(byId.values()).sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  await fs.writeFile(path.resolve(outPath), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${out.length} reactors -> ${outPath} (coords filled: ${filled})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

