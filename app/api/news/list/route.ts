import { NextRequest, NextResponse } from 'next/server';
import { readLocalNews } from '@/lib/news/localStore';
import type { NewsItem } from '@/lib/news/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim().toLowerCase();
  const source = (sp.get('source') || '').trim();
  const tag = (sp.get('tag') || '').trim();
  const featured = sp.get('featured') === 'true';
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

  if (featured) {
    const SOURCE_PRIORITY = new Map<string, number>([
      ['IAEA News', 1],
      ['World Nuclear News', 2],
      ['World Nuclear Association', 3],
      ['American Nuclear Society', 4],
      ['DOE Office of Nuclear Energy', 5],
      ['Nuclear Innovation Alliance', 6],
      ['Nuclear Engineering International', 7],
      ['POWER Magazine', 8],
      ['Nuclear Energy Institute', 9],
      ['NRC News Releases', 10],
      ['NRC Power Reactor Status', 11],
    ]);

    const tagScore = (n: NewsItem) => {
      const t = n.tags || [];
      let s = 0;
      for (const x of t) {
        if (x.startsWith('company:')) s += 4;
        else if (x.startsWith('plant:')) s += 3;
        else if (x.startsWith('country:')) s += 2;
        else if (x.startsWith('type:')) s += 1;
      }
      return s;
    };

    const recencyScore = (iso: string) => {
      const d = new Date(iso);
      const t = d.getTime();
      if (!Number.isFinite(t)) return 0;
      const hours = (Date.now() - t) / 36e5;
      // Prefer "last 72 hours" but don't hard cut.
      return Math.max(0, 72 - hours);
    };

    const scored = out
      .map((n) => {
        const p = SOURCE_PRIORITY.get(n.source) ?? 50;
        const score = recencyScore(n.publishedAt) + tagScore(n) - p * 0.1;
        return { n, score, p };
      })
      .sort((a, b) => b.score - a.score);

    const best = scored[0]?.n || null;
    return NextResponse.json({ data: best ? [best] : [], count: best ? 1 : 0, limit: 1, offset: 0, source: 'local' });
  }

  const total = out.length;
  const page = out.slice(offset, offset + limit);

  return NextResponse.json({ data: page, count: total, limit, offset, source: 'local' });
}
