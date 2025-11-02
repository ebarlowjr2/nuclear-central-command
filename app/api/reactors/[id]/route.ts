import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: reactor, error: reactorError } = await supabaseAdmin
      .from('reactors')
      .select('*, countries(name, iso2, region)')
      .eq('id', id)
      .single();

    if (reactorError) {
      return NextResponse.json({ error: reactorError.message }, { status: 500 });
    }

    const { data: generation, error: genError } = await supabaseAdmin
      .from('generation_monthly')
      .select('*')
      .eq('reactor_id', id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(12);

    const { data: statusHistory, error: statusError } = await supabaseAdmin
      .from('reactor_status_history')
      .select('*')
      .eq('reactor_id', id)
      .order('effective_date', { ascending: false });

    return NextResponse.json({
      reactor,
      generation: generation || [],
      statusHistory: statusHistory || []
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const revalidate = 3600;
