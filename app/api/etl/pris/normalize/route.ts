import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import crypto from 'node:crypto';
import type { Reactor } from '@/lib/reactors/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  // Reuse CRON_SECRET as a simple admin secret for ETL endpoints.
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  const qp = req.nextUrl.searchParams.get('secret');
  return auth === `Bearer ${secret}` || qp === secret;
}

function asString(v: unknown) {
  return v == null ? '' : String(v).trim();
}

function asNumber(v: unknown): number | null {
  const s = asString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function stableId(source: string, key: string) {
  return crypto.createHash('sha256').update(`${source}::${key}`).digest('hex').slice(0, 24);
}

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== '') return v;
  }
  return null;
}

function normalizeStatus(raw: unknown): Reactor['status'] {
  const s = asString(raw).toLowerCase();
  if (s.includes('operat')) return 'operating';
  if (s.includes('construct')) return 'under_construction';
  if (s.includes('plan')) return 'planned';
  if (s.includes('decom') || s.includes('shut')) return 'shutdown';
  if (s.includes('suspend') || s.includes('offline')) return 'suspended';
  return 'planned';
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Set CRON_SECRET and call with Authorization: Bearer <CRON_SECRET>.' },
      { status: 401 }
    );
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const csv = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    return NextResponse.json({ error: 'CSV parsing error', details: parsed.errors }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const rows = parsed.data || [];

  const reactors: Reactor[] = [];
  for (const row of rows) {
    const plant = asString(pick(row, ['plant_name', 'PlantName', 'Plant', 'plant', 'Site']));
    const unit = asString(pick(row, ['unit_name', 'UnitName', 'Unit', 'unit']));
    const name = unit ? `${plant} ${unit}` : plant;
    const country = asString(pick(row, ['country', 'Country', 'CountryName']));
    if (!plant || !country) continue;

    const lat = asNumber(pick(row, ['latitude', 'Latitude', 'Lat', 'lat']));
    const lng = asNumber(pick(row, ['longitude', 'Longitude', 'Lon', 'lng']));
    const capacityMWe = asNumber(pick(row, ['net_capacity_mwe', 'NetCapacityMWe', 'Capacity', 'capacity_mwe']));
    const type = asString(pick(row, ['reactor_type', 'ReactorType', 'Type'])) || undefined;
    const operator = asString(pick(row, ['operator', 'Operator'])) || undefined;
    const prisId = asString(pick(row, ['iaea_pris_id', 'PRIS_ID', 'PRISId', 'pris_id']));
    const status = normalizeStatus(pick(row, ['status', 'Status']));

    const key = prisId || `${slug(country)}:${slug(plant)}:${slug(unit || 'unit')}`;
    reactors.push({
      id: prisId ? `pris-${prisId}` : stableId('pris', key),
      name,
      plant,
      country,
      lat,
      lng,
      status,
      capacityMWe,
      type,
      operator,
      source: 'IAEA PRIS (CSV import)',
      lastUpdated: nowIso,
    });
  }

  // De-dupe by id and sort for stable diffs.
  const byId = new Map<string, Reactor>();
  for (const r of reactors) byId.set(r.id, r);
  const out = Array.from(byId.values()).sort(
    (a, b) => a.country.localeCompare(b.country) || a.plant.localeCompare(b.plant) || a.name.localeCompare(b.name)
  );

  return NextResponse.json({ ok: true, count: out.length, data: out });
}

