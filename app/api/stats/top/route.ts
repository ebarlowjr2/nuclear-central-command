import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getLocalReactors } from '@/lib/reactors/localStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'capacity';
    const scope = searchParams.get('scope') || 'country';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Local-first: avoid any upstream network calls at request time unless explicitly enabled.
    if (process.env.USE_SUPABASE !== 'true') {
      const reactors = await getLocalReactors();

      if (scope === 'reactor') {
        const data = reactors
          .filter((r) => r.status === 'operating')
          .slice()
          .sort((a, b) => (b.capacityMWe ?? 0) - (a.capacityMWe ?? 0))
          .slice(0, limit)
          .map((r) => ({
            id: r.id,
            name: r.name,
            plant: r.plant,
            country: r.country,
            status: r.status,
            capacity_mwe: r.capacityMWe ?? 0,
            type: r.type,
            operator: r.operator,
            source: r.source,
          }));

        return NextResponse.json({ data, source: 'local' });
      }

      const countryMap = new Map<
        string,
        { country_id: string; country_name: string; iso2?: string; total_capacity: number; reactor_count: number; operating_count: number }
      >();

      for (const r of reactors) {
        const key = r.country;
        if (!key) continue;
        if (!countryMap.has(key)) {
          countryMap.set(key, {
            country_id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            country_name: key,
            total_capacity: 0,
            reactor_count: 0,
            operating_count: 0,
          });
        }
        const entry = countryMap.get(key)!;
        entry.total_capacity += r.capacityMWe ?? 0;
        entry.reactor_count += 1;
        if (r.status === 'operating') entry.operating_count += 1;
      }

      const sorted = Array.from(countryMap.values())
        .sort((a, b) => {
          if (metric === 'capacity') return b.total_capacity - a.total_capacity;
          return b.reactor_count - a.reactor_count;
        })
        .slice(0, limit);

      return NextResponse.json({ data: sorted, source: 'local' });
    }

    const supabase = getSupabaseAdmin();
    if (scope === 'reactor') {
      const { data, error } = await supabase
        .from('reactors')
        .select('*, countries(name, iso2)')
        .eq('status', 'Operating')
        .order('net_capacity_mwe', { ascending: false })
        .limit(limit);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: data || [] });
    } else {
      const { data: reactors, error } = await supabase
        .from('reactors')
        .select('country_id, net_capacity_mwe, status, countries(name, iso2)');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const countryMap = new Map();
      reactors?.forEach(r => {
        if (!r.country_id) return;
        if (!countryMap.has(r.country_id)) {
          countryMap.set(r.country_id, {
            country_id: r.country_id,
            country_name: (r as any).countries?.name,
            iso2: (r as any).countries?.iso2,
            total_capacity: 0,
            reactor_count: 0,
            operating_count: 0
          });
        }
        const entry = countryMap.get(r.country_id);
        entry.total_capacity += r.net_capacity_mwe || 0;
        entry.reactor_count += 1;
        if (r.status === 'Operating') {
          entry.operating_count += 1;
        }
      });

      const sorted = Array.from(countryMap.values())
        .sort((a, b) => {
          if (metric === 'capacity') return b.total_capacity - a.total_capacity;
          return b.reactor_count - a.reactor_count;
        })
        .slice(0, limit);

      return NextResponse.json({ data: sorted });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const revalidate = 3600;
