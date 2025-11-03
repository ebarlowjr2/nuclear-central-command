import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * List securities with their latest quotes
 * Optional filter by category
 * 
 * Query params:
 * - category: Filter by category (ETF, SMR/Advanced, Fuel & Equipment, Utility)
 */
export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const category = url.searchParams.get('category');

    let query = supabaseAdmin
      .from('securities')
      .select('symbol,name,category,exchange,security_quotes(price,change_pct,currency,updated_at)')
      .order('symbol');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching securities:', error);
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 });
    }

    const rows = (data ?? []).map((r: any) => ({
      symbol: r.symbol,
      name: r.name,
      category: r.category,
      exchange: r.exchange,
      price: r.security_quotes?.price ?? null,
      change_pct: r.security_quotes?.change_pct ?? null,
      currency: r.security_quotes?.currency ?? 'USD',
      updated_at: r.security_quotes?.updated_at ?? null
    }));

    return NextResponse.json(
      {
        ok: true,
        items: rows
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=3600'
        }
      }
    );
  } catch (e: any) {
    console.error('List exception:', e);
    return NextResponse.json({
      ok: false,
      error: e.message
    }, { status: 500 });
  }
}
