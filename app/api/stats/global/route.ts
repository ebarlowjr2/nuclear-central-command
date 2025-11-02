import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: reactors, error: reactorsError } = await supabase
      .from('reactors')
      .select('status, net_capacity_mwe');

    if (reactorsError) {
      return NextResponse.json({ error: reactorsError.message }, { status: 500 });
    }

    const totalReactors = reactors?.length || 0;
    const operating = reactors?.filter(r => r.status === 'Operating').length || 0;
    const underConstruction = reactors?.filter(r => r.status === 'Under Construction').length || 0;
    const planned = reactors?.filter(r => r.status === 'Planned').length || 0;
    const decommissioned = reactors?.filter(r => r.status === 'Decommissioned').length || 0;

    const totalCapacity = reactors?.reduce((sum, r) => sum + (r.net_capacity_mwe || 0), 0) || 0;
    const operatingCapacity = reactors
      ?.filter(r => r.status === 'Operating')
      .reduce((sum, r) => sum + (r.net_capacity_mwe || 0), 0) || 0;

    const operatingPercent = totalReactors > 0 ? (operating / totalReactors) * 100 : 0;

    return NextResponse.json({
      totalReactors,
      operating,
      underConstruction,
      planned,
      decommissioned,
      totalCapacity: Math.round(totalCapacity),
      operatingCapacity: Math.round(operatingCapacity),
      operatingPercent: Math.round(operatingPercent * 10) / 10
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const revalidate = 3600;
