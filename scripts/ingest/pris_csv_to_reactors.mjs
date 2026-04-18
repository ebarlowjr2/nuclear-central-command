import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import Papa from 'papaparse';

// Usage:
//   node scripts/ingest/pris_csv_to_reactors.mjs data/sources/pris.csv data/reactors.pris.json
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

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Usage: node scripts/ingest/pris_csv_to_reactors.mjs <input.csv> <output.json>');
    process.exit(2);
  }

  const csv = await fs.readFile(path.resolve(input), 'utf8');
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.error('CSV parse errors:', parsed.errors.slice(0, 5));
    process.exit(1);
  }

  const rows = parsed.data || [];
  const nowIso = new Date().toISOString();

  const reactors = rows
    .map((row) => {
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

