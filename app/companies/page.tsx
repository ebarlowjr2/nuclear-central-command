'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Company, CompanyCategory } from '@/lib/companies/types';
import PageHeader from '@/components/layout/PageHeader';
import { STATUS_COLORS } from '@/components/badges/statusColors';

type Filters = {
  q: string;
  category: CompanyCategory | 'all';
};

const CATEGORY_LABEL: Record<CompanyCategory, string> = {
  utilities: 'Utilities',
  smr_developers: 'SMR Developers',
  reactor_vendors: 'Reactor Vendors',
  uranium_fuel: 'Uranium & Fuel',
  engineering: 'Engineering',
  research_advocacy: 'Research & Advocacy',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ q: '', category: 'all' });

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/companies/list?limit=200');
        if (!res.ok) throw new Error(await res.text());
        const data: unknown = await res.json();
        const list = (() => {
          if (!data || typeof data !== 'object') return [];
          const maybe = (data as Record<string, unknown>).data;
          return Array.isArray(maybe) ? (maybe as Company[]) : [];
        })();
        if (alive) setItems(list);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load companies.';
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

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter((c) => {
      if (filters.category !== 'all' && c.category !== filters.category) return false;
      if (!q) return true;
      const hay = `${c.name} ${c.description} ${c.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filters]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ecosystem • Explorer"
        title="Companies"
        subtitle="Explore the nuclear ecosystem: utilities, SMR developers, vendors, fuel, engineering, and advocacy."
        cta={{ href: '/news', label: 'See latest news' }}
      />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="h-10 rounded-md border bg-white px-3 text-sm md:col-span-3"
              placeholder="Search companies..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
            <select
              className="h-10 rounded-md border bg-white px-3 text-sm"
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value as Filters['category'] }))
              }
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Showing {filtered.length} companies.</div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="font-semibold">Companies failed to load</div>
          <div className="text-muted-foreground mt-1">{error}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center text-sm text-muted-foreground">
          No companies match these filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const latest = c.latestUpdate ? formatDate(c.latestUpdate) : null;
            return (
              <Card key={c.id} className="rounded-2xl hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{c.name}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">{CATEGORY_LABEL[c.category]}</div>
                    </div>
                    {latest && (
                      <span
                        className="text-xs rounded-full border px-2 py-1 text-slate-700 whitespace-nowrap"
                        style={{
                          borderColor: STATUS_COLORS.operating.border,
                          background: STATUS_COLORS.operating.bg,
                        }}
                      >
                        Updated {latest}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{c.description}</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <a className="text-primary hover:underline" href={c.website} target="_blank" rel="noreferrer">
                      Website
                    </a>
                    {c.socials?.linkedin && (
                      <a className="text-primary hover:underline" href={c.socials.linkedin} target="_blank" rel="noreferrer">
                        LinkedIn
                      </a>
                    )}
                    {c.socials?.x && (
                      <a className="text-primary hover:underline" href={c.socials.x} target="_blank" rel="noreferrer">
                        X
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
