import fs from 'node:fs/promises';
import path from 'node:path';

// Usage:
//   node scripts/ingest/rds2_merge_to_reactors.mjs <table14.csv> <table13.csv> <table12.csv> <out.json>
//
// This calls the single-file parser (pris_csv_to_reactors.mjs) logic by spawning Node would be messy;
// instead, we keep this as a simple merger that expects you've already run the per-table conversion
// OR that you pass the CSVs and we parse them here.
//
// For simplicity and determinism, this script reads the CSVs and writes the normalized Reactor[]
// in the app format, with stable ids (rds2::<Code>).

import Papa from 'papaparse';
import crypto from 'node:crypto';

function asString(v) {
  return v == null ? '' : String(v).trim();
}
function asNumber(v) {
  const s = asString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function slug(s) {
  return asString(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function stableId(source, key) {
  return crypto.createHash('sha256').update(`${source}::${key}`).digest('hex').slice(0, 24);
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
  // Some files are raw CSV exports from RDS-2 tables (with 4 title rows), others (like Table 12)
  // may be converted from XLSX with headers already at the top.
  const lines = csvText.split(/\r?\n/);
  const hasHeaderTop = lines[0]?.includes('Reactor Name') && lines[0]?.includes('Country') && lines[0]?.includes('Code');
  const chunk = hasHeaderTop ? csvText : lines.slice(4).join('\n');

  const parsed = Papa.parse(chunk, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) throw new Error(`CSV parse errors: ${parsed.errors[0].message}`);
  return parsed.data || [];
}

function convertRows(rows, status) {
  const nowIso = new Date().toISOString();
  let lastCountry = '';
  return rows
    .map((row) => {
      const plant = asString(pick(row, ['Reactor Name']));
      const countryRaw = asString(pick(row, ['Country']));
      if (countryRaw) lastCountry = countryRaw;
      const country = countryRaw || lastCountry;
      if (!plant || !country) return null;

      const code = asString(pick(row, ['Code']));
      const type = asString(pick(row, ['Type'])) || undefined;
      const model = asString(pick(row, ['Model'])) || undefined;
      const operator = asString(pick(row, ['Operator'])) || undefined;

      // PapaParse columns: "Capacity [MW]"=Thermal, ""=Gross, "_1"=Net
      const net = asNumber(pick(row, ['_1', 'Net']));

      const idKey = code || `${slug(country)}:${slug(plant)}`;
      return {
        id: stableId('rds2', idKey),
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
  const [t14, t13, t12, outPath] = process.argv.slice(2);
  if (!t14 || !t13 || !t12 || !outPath) {
    console.error('Usage: node scripts/ingest/rds2_merge_to_reactors.mjs <table14.csv> <table13.csv> <table12.csv> <out.json>');
    process.exit(2);
  }

  const [csv14, csv13, csv12] = await Promise.all([
    fs.readFile(path.resolve(t14), 'utf8'),
    fs.readFile(path.resolve(t13), 'utf8'),
    fs.readFile(path.resolve(t12), 'utf8'),
  ]);

  const r14 = convertRows(parseRds2Csv(csv14), 'operating');
  const r13 = convertRows(parseRds2Csv(csv13), 'under_construction');
  const r12 = convertRows(parseRds2Csv(csv12), 'planned');

  const byId = new Map();
  for (const r of [...r14, ...r13, ...r12]) byId.set(r.id, r);
  const merged = Array.from(byId.values()).sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  await fs.writeFile(path.resolve(outPath), JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${merged.length} reactors -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
