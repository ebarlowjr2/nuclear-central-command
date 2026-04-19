import { NextResponse } from 'next/server';
import { readLocalNews } from '@/lib/news/localStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await readLocalNews();
  const latest = items[0]?.publishedAt || null;
  const oldest = items[items.length - 1]?.publishedAt || null;
  const sources = Array.from(new Set(items.map((n) => n.source))).sort();
  return NextResponse.json({
    ok: true,
    count: items.length,
    latestPublishedAt: latest,
    oldestPublishedAt: oldest,
    sources,
  });
}

