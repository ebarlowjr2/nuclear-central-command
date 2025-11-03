import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * One-time seed route to populate securities table
 * Run this once by visiting /api/market/seed, then disable/remove this route
 * 
 * Security: Only enable when ALLOW_MARKET_SEED=true in environment
 */
export async function GET() {
  try {
    if (process.env.ALLOW_MARKET_SEED !== 'true') {
      return NextResponse.json({
        ok: false,
        error: 'Market seeding is disabled. Set ALLOW_MARKET_SEED=true to enable.'
      }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const seed = [
      { symbol: 'URA', name: 'Global X Uranium ETF', category: 'ETF', exchange: 'NYSE Arca' },
      { symbol: 'URNM', name: 'Sprott Uranium Miners ETF', category: 'ETF', exchange: 'NYSE Arca' },
      { symbol: 'NLR', name: 'VanEck Uranium & Nuclear ETF', category: 'ETF', exchange: 'NYSE Arca' },
      { symbol: 'NUKZ', name: 'Range Nuclear Renaissance ETF', category: 'ETF', exchange: 'NYSE Arca' },
      
      { symbol: 'SMR', name: 'NuScale Power', category: 'SMR/Advanced', exchange: 'NYSE' },
      { symbol: 'OKLO', name: 'Oklo Inc.', category: 'SMR/Advanced', exchange: 'NYSE' },
      
      { symbol: 'CCJ', name: 'Cameco', category: 'Fuel & Equipment', exchange: 'NYSE' },
      { symbol: 'BWXT', name: 'BWX Technologies', category: 'Fuel & Equipment', exchange: 'NYSE' },
      { symbol: 'UEC', name: 'Uranium Energy Corp', category: 'Fuel & Equipment', exchange: 'NYSE' },
      { symbol: 'DNN', name: 'Denison Mines', category: 'Fuel & Equipment', exchange: 'NYSE' },
      
      { symbol: 'EXC', name: 'Exelon', category: 'Utility', exchange: 'NASDAQ' },
      { symbol: 'DUK', name: 'Duke Energy', category: 'Utility', exchange: 'NYSE' },
      { symbol: 'SO', name: 'Southern Company', category: 'Utility', exchange: 'NYSE' },
      { symbol: 'CEG', name: 'Constellation Energy', category: 'Utility', exchange: 'NASDAQ' }
    ];

    const { data, error } = await supabaseAdmin
      .from('securities')
      .upsert(seed, { onConflict: 'symbol' });

    if (error) {
      console.error('Seed error:', error);
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Securities seeded successfully',
      count: seed.length,
      note: 'You can now disable this route by removing ALLOW_MARKET_SEED or deleting this file'
    });
  } catch (e: any) {
    console.error('Seed exception:', e);
    return NextResponse.json({
      ok: false,
      error: e.message
    }, { status: 500 });
  }
}
