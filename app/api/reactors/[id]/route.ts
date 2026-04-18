import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getLocalReactors } from '@/lib/reactors/localStore';
import { normalizeSupabaseReactorRow } from '@/lib/reactors/normalize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Prefer Supabase when configured; fall back to local dataset otherwise.
    if (process.env.USE_SUPABASE !== 'true') {
      const reactors = await getLocalReactors();
      const reactor = reactors.find((r) => r.id === id) || null;
      return NextResponse.json({
        reactor,
        generation: [],
        statusHistory: [],
        source: 'local',
      });
    }

    try {
      const supabase = getSupabaseAdmin();

      const { data: reactor, error: reactorError } = await supabase
        .from('reactors')
        .select('*, countries(name, iso2, region)')
        .eq('id', id)
        .single();

      if (reactorError) {
        return NextResponse.json({ error: reactorError.message }, { status: 500 });
      }

      const { data: generation } = await supabase
        .from('generation_monthly')
        .select('*')
        .eq('reactor_id', id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);

      const { data: statusHistory } = await supabase
        .from('reactor_status_history')
        .select('*')
        .eq('reactor_id', id)
        .order('effective_date', { ascending: false });

      return NextResponse.json({
        reactor: normalizeSupabaseReactorRow(reactor),
        generation: generation || [],
        statusHistory: statusHistory || [],
        source: 'supabase',
      });
    } catch {
      const reactors = await getLocalReactors();
      const reactor = reactors.find((r) => r.id === id) || null;
      return NextResponse.json({
        reactor,
        generation: [],
        statusHistory: [],
        source: 'local',
      });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const revalidate = 3600;
