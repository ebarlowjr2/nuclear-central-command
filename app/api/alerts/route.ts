import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reactor_id, alert_type } = body;

    if (!email || !alert_type) {
      return NextResponse.json({ error: 'Email and alert_type required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('alerts')
      .insert({ email, reactor_id, alert_type })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
