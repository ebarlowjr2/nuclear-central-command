import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import Papa from 'papaparse';

// Usage:
//   node scripts/ingest/pris_csv_to_reactors.mjs data/sources/pris.csv data/reactors.pris.json
//   node scripts/ingest/pris_csv_to_reactors.mjs data/sources/2024_Table14.csv data/reactors.json
//   node scripts/ingest/pris_csv_to_reactors.mjs data/sources/2024_Table13.csv data/reactors.json
//
// Notes:
// - This intentionally produces the app's normalized Reactor shape.
// - No network calls: you bring the PRIS export CSV yourself.

function asString(v) {
  if (v == null) return '';
  return String(v).trim();
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

function stableId(source, urlOrKey) {
  return crypto.createHash('sha256').update(`${source}::${urlOrKey}`).digest('hex').slice(0, 24);
}

function normalizeStatus(raw) {
  const s = asString(raw).toLowerCase();
  if (s.includes('operat')) return 'operating';
  if (s.includes('construct')) return 'under_construction';
  if (s.includes('plan')) return 'planned';
  if (s.includes('decom') || s.includes('shut')) return 'shutdown';
  if (s.includes('suspend') || s.includes('offline')) return 'suspended';
  // Default to planned rather than operating if ambiguous.
  return 'planned';
}

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return row[k];
  }
  return null;
}

function looksLikeRds2Table(rows) {
  // RDS-2 tables have explicit columns like "Country", "Code", "Reactor Name".
  if (!rows || rows.length < 8) return false;
  const r = rows.find((x) => x && (x.Country || x['Reactor Name'] || x.Code));
  return !!r;
}

function normalizeRds2Row(row) {
  // Handles Table 13/14 layout.
  // Expected columns:
  // Country, Code, Reactor Name, Type, Model, Capacity [MW] Thermal/Gross/Net, Operator, NSSS, Start/Grid/Comm etc.
  const plant = asString(pick(row, ['Reactor Name', 'ReactorName', 'reactor_name']));
  const country = asString(pick(row, ['Country', 'country']));
  const code = asString(pick(row, ['Code', 'code']));
  const type = asString(pick(row, ['Type', 'type'])) || undefined;
  const model = asString(pick(row, ['Model', 'model'])) || undefined;
  const operator = asString(pick(row, ['Operator', 'operator'])) || undefined;

  // For RDS-2, "Capacity [MW]" column is Thermal, and subsequent unnamed columns are Gross and Net.
  // PapaParse names them "Capacity [MW]" (thermal), "" (gross), and "_1" (net).
  const net = asNumber(pick(row, ['_1', 'Net', 'net']));
  // Table 13/14 files don't include a status column; infer from the filename-derived context if present.
  const status = row.__rds2_status || 'operating';

  if (!plant || !country) return null;

  // RDS-2 uses uppercase country names; normalize to title case for UI consistency.
  const countryNorm = country
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');

  const idKey = code || `${slug(country)}:${slug(plant)}`;
  return {
    id: stableId('rds2', idKey),
    name: plant,
    plant,
    country: countryNorm,
    lat: null,
    lng: null,
    status,
    capacityMWe: net,
    type: type || model || undefined,
    operator,
    source: 'IAEA RDS-2 (PRIS-derived CSV)',
    lastUpdated: new Date().toISOString(),
  };
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Usage: node scripts/ingest/pris_csv_to_reactors.mjs <input.csv> <output.json>');
    process.exit(2);
  }

  const csv = await fs.readFile(path.resolve(input), 'utf8');

  // RDS-2 tables have title rows before the real header.
  // Detect by filename and start parsing at the header row (0-based index 4 for 2024 tables).
  const isRds2File = /Table(12|13|14)\.csv$/i.test(path.basename(input)) || /Table(12|13|14)/i.test(input);
  const rds2Status = /Table13/i.test(input)
    ? 'under_construction'
    : /Table12/i.test(input)
      ? 'planned'
      : /Table14/i.test(input)
        ? 'operating'
        : 'operating';
  const parseOptions = isRds2File
    ? { header: true, skipEmptyLines: true, beforeFirstChunk: (chunk) => chunk.split(/\r?\n/).slice(4).join('\n') }
    : { header: true, skipEmptyLines: true };

  const parsed = Papa.parse(csv, parseOptions);
  if (parsed.errors?.length) {
    console.error('CSV parse errors:', parsed.errors.slice(0, 5));
    process.exit(1);
  }

  const rows = parsed.data || [];
  const nowIso = new Date().toISOString();

  const isRds2 = looksLikeRds2Table(rows);

  const reactors = rows
    .map((row) => {
      if (isRds2File) row.__rds2_status = rds2Status;
      if (isRds2) return normalizeRds2Row(row);
      const plant = asString(pick(row, ['plant_name', 'PlantName', 'Plant', 'plant', 'Site']));
      const unit = asString(pick(row, ['unit_name', 'UnitName', 'Unit', 'unit']));
      const name = unit ? `${plant} ${unit}` : plant;

      const country = asString(pick(row, ['country', 'Country', 'CountryName']));
      const lat = asNumber(pick(row, ['latitude', 'Latitude', 'Lat', 'lat']));
      const lng = asNumber(pick(row, ['longitude', 'Longitude', 'Lon', 'lng']));

      const capacityMWe = asNumber(pick(row, ['net_capacity_mwe', 'NetCapacityMWe', 'Capacity', 'capacity_mwe']));
      const type = asString(pick(row, ['reactor_type', 'ReactorType', 'Type']));
      const operator = asString(pick(row, ['operator', 'Operator']));
      const prisId = asString(pick(row, ['iaea_pris_id', 'PRIS_ID', 'PRISId', 'pris_id']));

      if (!plant || !country) return null;

      const status = normalizeStatus(pick(row, ['status', 'Status']));
      const idKey = prisId || `${slug(country)}:${slug(plant)}:${slug(unit || 'unit')}`;

      return {
        id: prisId ? `pris-${prisId}` : stableId('pris', idKey),
        name,
        plant,
        country,
        lat,
        lng,
        status,
        capacityMWe,
        type: type || undefined,
        operator: operator || undefined,
        source: 'IAEA PRIS (CSV import)',
        lastUpdated: nowIso,
      };
    })
    .filter(Boolean);

  // De-dupe by id.
  const byId = new Map();
  for (const r of reactors) byId.set(r.id, r);
  const out = Array.from(byId.values()).sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  await fs.writeFile(path.resolve(output), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${out.length} reactors -> ${output}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
