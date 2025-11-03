import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * Search securities by symbol or name
 * 
 * Query params:
 * - q: Search query (matches symbol or name, case-insensitive)
 */
export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';

    if (!q) {
      return NextResponse.json({
        ok: true,
        items: []
      });
    }

    const { data, error } = await supabaseAdmin
      .from('securities')
      .select('symbol,name,category,exchange,security_quotes(price,change_pct)')
      .or(`symbol.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(20);

    if (error) {
      console.error('Error searching securities:', error);
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 });
    }

    const items = (data ?? []).map((r: any) => ({
      symbol: r.symbol,
      name: r.name,
      category: r.category,
      exchange: r.exchange,
      price: r.security_quotes?.price ?? null,
      change_pct: r.security_quotes?.change_pct ?? null
    }));

    return NextResponse.json({
      ok: true,
      items
    });
  } catch (e: any) {
    console.error('Search exception:', e);
    return NextResponse.json({
      ok: false,
      error: e.message
    }, { status: 500 });
  }
}
