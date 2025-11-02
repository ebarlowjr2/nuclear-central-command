import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const apiKey = process.env.EIA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        ok: false, 
        error: 'EIA_API_KEY not configured' 
      }, { status: 500 });
    }

    
    
    return NextResponse.json({ 
      ok: true, 
      message: 'EIA ETL job completed (placeholder)',
      count: 0 
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
