import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let host: string | null = null;

  try {
    if (url) {
      host = new URL(url).host;
    }
  } catch {
    host = null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('countries')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, host }, { status: 500 });
    }

    return NextResponse.json({ ok: true, host, sampleCount: data?.length ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, host }, { status: 500 });
  }
}
