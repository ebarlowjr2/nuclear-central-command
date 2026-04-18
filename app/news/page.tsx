'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { NewsItem } from '@/lib/news/types';
import PageHeader from '@/components/layout/PageHeader';

type Filters = {
  q: string;
  source: string | 'all';
  tag: string | 'all';
};

function uniq(xs: string[]) {
  return Array.from(new Set(xs)).sort();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ q: '', source: 'all', tag: 'all' });
  const [offset, setOffset] = useState(0);
  const limit = 25;

  // Load a larger set for filter dropdowns (still just local DB).
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/news/list?limit=200&offset=0');
        if (!res.ok) throw new Error(await res.text());
        const data: unknown = await res.json();
        const list = (() => {
          if (!data || typeof data !== 'object') return [];
          const maybe = (data as Record<string, unknown>).data;
          return Array.isArray(maybe) ? (maybe as NewsItem[]) : [];
        })();
        if (alive) setItems(list);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load news.';
        if (alive) setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const sources = useMemo(() => uniq(items.map((n) => n.source).filter(Boolean)), [items]);
  const tags = useMemo(() => {
    const raw: string[] = [];
    for (const n of items) raw.push(...(n.tags || []));
    // Keep the UX focused: country/plant/type tags plus a small set of others.
    return uniq(
      raw.filter((t) => t.startsWith('country:') || t.startsWith('plant:') || t.startsWith('type:'))
    );
  }, [items]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter((n) => {
      if (filters.source !== 'all' && n.source !== filters.source) return false;
      if (filters.tag !== 'all' && !(n.tags || []).includes(filters.tag)) return false;
      if (!q) return true;
      const hay = `${n.title} ${n.summary} ${(n.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filters]);

  const featured = filtered[0] || null;
  const page = filtered.slice(offset, offset + limit);

  useEffect(() => {
    setOffset(0);
  }, [filters.q, filters.source, filters.tag]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Local-first • RSS"
        title="Nuclear News"
        subtitle="Curated headlines from trusted nuclear and energy sources. Articles are ingested and stored locally."
      />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="h-10 rounded-md border bg-white px-3 text-sm md:col-span-2"
              placeholder="Search headlines..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
            <select
              className="h-10 rounded-md border bg-white px-3 text-sm"
              value={filters.source}
              onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border bg-white px-3 text-sm"
              value={filters.tag}
              onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
            >
              <option value="all">All tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Showing {filtered.length} articles (loaded {items.length} latest for filtering).
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="font-semibold">News failed to load</div>
          <div className="text-muted-foreground mt-1">{error}</div>
          <div className="text-muted-foreground mt-2">
            If this is a fresh deploy, the news store may be empty until the first cron run. You can
            manually trigger `/api/etl/news/sync`.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center text-sm text-muted-foreground">
          No articles match these filters.
        </div>
      ) : (
        <div className="space-y-6">
          {featured && (
            <Card className="border-slate-200 rounded-2xl">
              <CardHeader>
                <CardTitle>Featured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <a className="text-xl font-semibold hover:underline" href={featured.url} target="_blank" rel="noreferrer">
                    {featured.title}
                  </a>
                  <div className="text-sm text-muted-foreground">
                    {featured.source} • {formatDate(featured.publishedAt)}
                  </div>
                  {featured.summary && <p className="text-sm">{featured.summary}</p>}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(featured.tags || [])
                      .filter((t) => t.startsWith('country:') || t.startsWith('plant:') || t.startsWith('type:'))
                      .slice(0, 6)
                      .map((t) => (
                        <button
                          key={t}
                          className="text-xs rounded-full border bg-white px-2 py-1 hover:bg-slate-50"
                          onClick={() => setFilters((f) => ({ ...f, tag: t }))}
                        >
                          {t}
                        </button>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="rounded-2xl border bg-white overflow-hidden">
            <div className="divide-y">
              {page.map((n) => (
                <div key={n.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <a className="font-medium hover:underline" href={n.url} target="_blank" rel="noreferrer">
                      {n.title}
                    </a>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(n.publishedAt)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{n.source}</div>
                  {n.summary && <div className="text-sm mt-2">{n.summary}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Showing {offset + 1}–{Math.min(offset + limit, filtered.length)} of {filtered.length}
            </div>
            <div className="flex gap-2">
              <button
                className="h-9 rounded-md border bg-white px-3 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0}
              >
                Previous
              </button>
              <button
                className="h-9 rounded-md border bg-white px-3 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= filtered.length}
              >
                Next
              </button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Want more context? We can add tags for companies/reactor vendors in Phase 5 to power deeper exploration.
          </div>
        </div>
      )}

      <div className="text-sm">
        <Link className="text-primary hover:underline" href="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
