import { NextRequest, NextResponse } from 'next/server';
import { getCompaniesEnriched } from '@/lib/companies/localStore';
import type { Company } from '@/lib/companies/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim().toLowerCase();
  const category = (sp.get('category') || '').trim();
  const limit = Math.min(200, Math.max(1, Number(sp.get('limit') || 100)));
  const offset = Math.max(0, Number(sp.get('offset') || 0));

  const all = await getCompaniesEnriched();
  let out: Company[] = all;

  if (category) out = out.filter((c) => c.category === category);
  if (q) {
    out = out.filter((c) => {
      const hay = `${c.name} ${c.description} ${c.category}`.toLowerCase();
      return hay.includes(q);
    });
  }

  out = out.slice().sort((a, b) => a.name.localeCompare(b.name));
  const total = out.length;
  const page = out.slice(offset, offset + limit);

  return NextResponse.json({ data: page, count: total, limit, offset, source: 'local' });
}

