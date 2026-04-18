import { NextRequest, NextResponse } from 'next/server';
import { readLocalNews } from '@/lib/news/localStore';
import type { NewsItem } from '@/lib/news/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim().toLowerCase();
  const source = (sp.get('source') || '').trim();
  const tag = (sp.get('tag') || '').trim();
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') || 20)));
  const offset = Math.max(0, Number(sp.get('offset') || 0));

  const all = await readLocalNews();
  let out: NewsItem[] = all;

  if (source) out = out.filter((n) => n.source === source);
  if (tag) out = out.filter((n) => (n.tags || []).includes(tag));
  if (q) {
    out = out.filter((n) => {
      const hay = `${n.title} ${n.summary} ${(n.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }

  out = out.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const total = out.length;
  const page = out.slice(offset, offset + limit);

  return NextResponse.json({ data: page, count: total, limit, offset, source: 'local' });
}

