import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing error', 
        details: parsed.errors 
      }, { status: 400 });
    }

    const reactors = parsed.data.map((row: any) => ({
      plant_name: row.plant_name || row.PlantName,
      unit_name: row.unit_name || row.UnitName,
      reactor_type: row.reactor_type || row.Type,
      status: row.status || row.Status,
      net_capacity_mwe: parseFloat(row.net_capacity_mwe || row.Capacity || 0),
      latitude: parseFloat(row.latitude || row.Lat || 0),
      longitude: parseFloat(row.longitude || row.Lon || 0),
      operator: row.operator || row.Operator,
      iaea_pris_id: row.iaea_pris_id || row.PRIS_ID
    }));

    const { data, error } = await supabaseAdmin
      .from('reactors')
      .upsert(reactors, { onConflict: 'iaea_pris_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'PRIS data uploaded successfully',
      count: reactors.length 
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
