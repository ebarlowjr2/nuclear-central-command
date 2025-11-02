import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'capacity';
    const scope = searchParams.get('scope') || 'country';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (scope === 'reactor') {
      const { data, error } = await supabaseAdmin
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
      const { data: reactors, error } = await supabaseAdmin
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const revalidate = 3600;
