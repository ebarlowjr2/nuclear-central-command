import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No country IDs provided' }, { status: 400 });
    }

    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('*')
      .in('id', ids);

    if (countriesError) {
      return NextResponse.json({ error: countriesError.message }, { status: 500 });
    }

    const { data: reactors, error: reactorsError } = await supabase
      .from('reactors')
      .select('country_id, status, net_capacity_mwe')
      .in('country_id', ids);

    const { data: stats, error: statsError } = await supabase
      .from('country_energy_stats')
      .select('*')
      .in('country_id', ids)
      .order('year', { ascending: true });

    return NextResponse.json({
      countries: countries || [],
      reactors: reactors || [],
      stats: stats || []
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const revalidate = 3600;
