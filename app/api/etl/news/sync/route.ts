import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NEWS_SOURCES } from '@/lib/news/sources';
import { buildNewsItem, upsertLocalNews } from '@/lib/news/localStore';
import { getLocalReactors } from '@/lib/reactors/localStore';
import { tagNewsItem } from '@/lib/news/tagger';
import type { NewsItem } from '@/lib/news/types';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow local/dev by default
  const header = req.headers.get('x-cron-secret');
  const auth = req.headers.get('authorization');
  const qp = req.nextUrl.searchParams.get('secret');

  // Vercel Cron Jobs can authenticate via an Authorization header using CRON_SECRET.
  // Keep additional mechanisms for local/dev tooling.
  const bearerOk = auth === `Bearer ${secret}`;
  return bearerOk || header === secret || qp === secret;
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parser = new Parser({
    timeout: 20_000,
    // Some feeds reject default UA; be a polite robot.
    headers: { 'User-Agent': 'NuclearCommandCenterBot/1.0 (+news ingestion)' },
  });

  const reactors = await getLocalReactors();
  const fetched: NewsItem[] = [];
  const results: Array<{ source: string; ok: boolean; count: number; error?: string }> = [];

  for (const src of NEWS_SOURCES) {
    try {
      const feed = await parser.parseURL(src.rssUrl);
      const items = (feed.items || []).slice(0, 80);

      for (const it of items) {
        const url = String(it.link || '').trim();
        const title = String(it.title || '').trim();
        if (!url || !title) continue;

        const summary =
          stripHtml(String((it as any).contentSnippet || '')) ||
          stripHtml(String((it as any).content || '')) ||
          stripHtml(String((it as any).summary || '')) ||
          '';

        const publishedAt = (it as any).isoDate || (it as any).pubDate || undefined;
        const base = buildNewsItem({
          title,
          summary,
          url,
          source: src.name,
          publishedAt,
          tags: [],
        });
        fetched.push(tagNewsItem(base, reactors));
      }

      results.push({ source: src.name, ok: true, count: items.length });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to parse RSS';
      results.push({ source: src.name, ok: false, count: 0, error: msg });
    }
  }

  const stats = await upsertLocalNews(fetched);
  return NextResponse.json({
    ok: true,
    sources: results,
    fetched: fetched.length,
    ...stats,
  });
}

// Convenience: allow GET for manual runs in dev.
export async function GET(req: NextRequest) {
  return POST(req);
}
