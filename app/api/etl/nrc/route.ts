import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    
    const { data: usaCountry, error: countryError } = await supabaseAdmin
      .from('countries')
      .select('id')
      .eq('iso2', 'US')
      .single();

    if (countryError && countryError.code === 'PGRST116') {
      const { data: newCountry } = await supabaseAdmin
        .from('countries')
        .insert({ iso2: 'US', name: 'United States', region: 'Americas', subregion: 'Northern America' })
        .select()
        .single();
    }


    return NextResponse.json({ 
      ok: true, 
      message: 'NRC ETL job completed (placeholder)',
      count: 0 
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
