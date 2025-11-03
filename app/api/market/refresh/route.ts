import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { fetchQuotes } from '@/lib/market';

export const dynamic = 'force-dynamic';

/**
 * ETL route to refresh security quotes from market data provider
 * Called by Vercel Cron or manually
 * 
 * Fetches latest quotes for all active securities and updates security_quotes table
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: secs, error } = await supabaseAdmin
      .from('securities')
      .select('symbol')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching securities:', error);
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 });
    }

    const symbols = (secs ?? []).map(s => s.symbol);
    
    if (!symbols.length) {
      return NextResponse.json({
        ok: true,
        updated: 0,
        message: 'No active securities to refresh'
      });
    }

    const quotes = await fetchQuotes(symbols);

    const rows = quotes.map(q => ({
      symbol: q.symbol,
      price: q.price,
      change_pct: q.changePct,
      currency: q.currency ?? 'USD',
      updated_at: new Date().toISOString()
    }));

    const { error: upErr } = await supabaseAdmin
      .from('security_quotes')
      .upsert(rows);

    if (upErr) {
      console.error('Error upserting quotes:', upErr);
      return NextResponse.json({
        ok: false,
        error: upErr.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      updated: rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error('Refresh exception:', e);
    return NextResponse.json({
      ok: false,
      error: e.message
    }, { status: 500 });
  }
}
