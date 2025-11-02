import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country');
    const metric = searchParams.get('metric') || 'nuclear_twh';

    if (!country) {
      return NextResponse.json({ error: 'Country parameter required' }, { status: 400 });
    }

    const { data: countryData, error: countryError } = await supabase
      .from('countries')
      .select('id')
      .eq('iso2', country)
      .single();

    if (countryError || !countryData) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('country_energy_stats')
      .select('*')
      .eq('country_id', countryData.id)
      .order('year', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const revalidate = 3600;
