import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('reactors')
      .select('*, countries(name, iso2)');

    if (status) {
      query = query.eq('status', status);
    }
    if (country) {
      query = query.eq('countries.iso2', country);
    }
    if (type) {
      query = query.eq('reactor_type', type);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('net_capacity_mwe', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count, limit, offset });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const revalidate = 3600;
