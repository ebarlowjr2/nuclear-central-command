import type { Reactor } from './types';

function isoNow() {
  return new Date().toISOString();
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function asString(v: unknown): string | null {
  if (typeof v === 'string' && v.trim() !== '') return v;
  return null;
}

function getObj(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

export function normalizeSupabaseReactorRow(row: Record<string, unknown>): Reactor {
  const countries = getObj(row.countries);
  const country =
    asString(countries?.name) ||
    asString(row.country) ||
    asString(row.country_name) ||
    asString(row.country_id) ||
    'Unknown';

  // DB values are usually "Operating", "Under Construction", etc.
  const rawStatus = String(row.status || '').toLowerCase();
  let status: Reactor['status'] = 'operating';
  if (rawStatus.includes('operat')) status = 'operating';
  else if (rawStatus.includes('construct')) status = 'under_construction';
  else if (rawStatus.includes('plan')) status = 'planned';
  else if (rawStatus.includes('decom') || rawStatus.includes('shut')) status = 'shutdown';
  else if (rawStatus.includes('suspend') || rawStatus.includes('offline')) status = 'suspended';

  const plant = asString(row.plant_name) || asString(row.plant) || asString(row.name) || 'Unknown plant';
  const unit = asString(row.unit_name) || '';
  const name = unit ? `${plant} ${unit}` : plant;

  return {
    id: asString(row.id) || `${plant}-${unit}`.trim().toLowerCase().replace(/\s+/g, '-'),
    name,
    plant,
    country: String(country),
    lat: asNumber(row.latitude),
    lng: asNumber(row.longitude),
    status,
    capacityMWe:
      asNumber(row.net_capacity_mwe),
    type: asString(row.reactor_type) || undefined,
    operator: asString(row.operator) || undefined,
    source: 'PRIS (via local DB)',
    lastUpdated: asString(row.last_updated) || isoNow(),
  };
}
