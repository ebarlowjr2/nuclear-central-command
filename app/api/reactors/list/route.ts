import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getLocalReactors } from '@/lib/reactors/localStore';
import { filterReactors } from '@/lib/reactors/filters';
import type { ReactorStatus } from '@/lib/reactors/types';
import { normalizeSupabaseReactorRow } from '@/lib/reactors/normalize';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = (searchParams.get('status') || undefined) as ReactorStatus | undefined;
    const country = searchParams.get('country') || undefined;
    const type = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Prefer Supabase when configured, but never break local/dev environments.
    // If Supabase env vars are missing, fall back to a local normalized dataset.
    try {
      const supabase = getSupabaseAdmin();

      let query = supabase.from('reactors').select('*, countries(name, iso2)');

      if (status) query = query.eq('status', status);
      if (country) query = query.eq('countries.iso2', country);
      if (type) query = query.eq('reactor_type', type);

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('net_capacity_mwe', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const normalized = (data || []).map(normalizeSupabaseReactorRow);
      return NextResponse.json({ data: normalized, count: count ?? normalized.length, limit, offset, source: 'supabase' });
    } catch {
      const reactors = await getLocalReactors();
      const filtered = filterReactors(reactors, { status, country, type, limit, offset });
      const total = filtered.length;
      const paged = filtered.slice(offset, offset + limit);
      return NextResponse.json({ data: paged, count: total, limit, offset, source: 'local' });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const revalidate = 3600;
