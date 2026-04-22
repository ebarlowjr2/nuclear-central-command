import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NEWS_SOURCES } from '@/lib/news/sources';
import { buildNewsItem, readLocalNews, upsertNews } from '@/lib/news/localStore';
import { getLocalReactors } from '@/lib/reactors/localStore';
import { tagNewsItem } from '@/lib/news/tagger';
import { getCompaniesEnriched } from '@/lib/companies/localStore';
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

function clampSummary(s: string) {
  const t = stripHtml(s);
  if (t.length <= 360) return t;
  return t.slice(0, 360).replace(/\s+\S*$/, '').trim() + '…';
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Vercel/serverless filesystems are not a durable place to store data.
  // This endpoint is still useful for debugging fetches, but persistence is handled by offline sync
  // (e.g. GitHub Actions) that commits `data/news.json`.
  const canPersist = false;

  const parser = new Parser({
    timeout: 20_000,
    // Some feeds reject default UA; be a polite robot.
    headers: { 'User-Agent': 'NuclearCommandCenterBot/1.0 (+news ingestion)' },
  });

  const [reactors, companies] = await Promise.all([getLocalReactors(), getCompaniesEnriched()]);
  const fetched: NewsItem[] = [];
  const results: Array<{ source: string; ok: boolean; count: number; error?: string }> = [];
  const startedAt = new Date().toISOString();

  for (const src of NEWS_SOURCES) {
    try {
      const feed = await parser.parseURL(src.rssUrl);
      const items = (feed.items || []).slice(0, 80);

      for (const it of items) {
        const url = String(it.link || '').trim();
        const title = String(it.title || '').trim();
        if (!url || !title) continue;

        const summary =
          clampSummary(String((it as any).contentSnippet || '')) ||
          clampSummary(String((it as any).content || '')) ||
          clampSummary(String((it as any).summary || '')) ||
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
        fetched.push(tagNewsItem(base, reactors, companies));
      }

      results.push({ source: src.name, ok: true, count: items.length });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to parse RSS';
      results.push({ source: src.name, ok: false, count: 0, error: msg });
    }
  }

  const existing = await readLocalNews();
  const stats = upsertNews(existing, fetched);
  return NextResponse.json({
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    sources: results,
    fetched: fetched.length,
    total: stats.total,
    inserted: stats.inserted,
    updated: stats.updated,
    persisted: canPersist,
    note: canPersist
      ? 'Persistence is not implemented for serverless writes. Use offline sync to commit data/news.json.'
      : 'Run offline sync (GitHub Actions) to commit data/news.json for deployments.',
  });
}

// Convenience: allow GET for manual runs in dev.
export async function GET(req: NextRequest) {
  return POST(req);
}
