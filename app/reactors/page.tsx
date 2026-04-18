'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import type { Reactor } from '@/lib/reactors/types';
import PageHeader from '@/components/layout/PageHeader';
import StatusPill from '@/components/badges/StatusPill';

type SortKey = 'name' | 'capacity' | 'status';
type SortDir = 'asc' | 'desc';

type DirectoryFilters = {
  q: string;
  status: Reactor['status'] | 'all';
  country: string | 'all';
  type: string | 'all';
  minCapacity: string;
  maxCapacity: string;
  sortKey: SortKey;
  sortDir: SortDir;
};

const STATUS_ORDER: Record<Reactor['status'], number> = {
  operating: 1,
  under_construction: 2,
  planned: 3,
  suspended: 4,
  shutdown: 5,
};

export default function ReactorsPage() {
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [filters, setFilters] = useState<DirectoryFilters>({
    q: '',
    status: 'all',
    country: 'all',
    type: 'all',
    minCapacity: '',
    maxCapacity: '',
    sortKey: 'capacity',
    sortDir: 'desc',
  });

  useEffect(() => {
    async function fetchReactors() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reactors/list?limit=5000');
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed (${res.status})`);
        }
        const data: unknown = await res.json();
        const list = (() => {
          if (!data || typeof data !== 'object') return [];
          const maybe = (data as Record<string, unknown>).data;
          return Array.isArray(maybe) ? (maybe as Reactor[]) : [];
        })();
        setReactors(list);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load reactor directory.';
        setError(message);
        setReactors([]);
      } finally {
        setLoading(false);
      }
    }

    fetchReactors();
  }, []);

  const countries = useMemo(
    () => Array.from(new Set(reactors.map((r) => r.country).filter(Boolean))).sort(),
    [reactors]
  );

  const types = useMemo(
    () => Array.from(new Set(reactors.map((r) => r.type).filter(Boolean) as string[])).sort(),
    [reactors]
  );

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const minCap = filters.minCapacity.trim() === '' ? null : Number(filters.minCapacity);
    const maxCap = filters.maxCapacity.trim() === '' ? null : Number(filters.maxCapacity);

    let out = reactors.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.country !== 'all' && r.country !== filters.country) return false;
      if (filters.type !== 'all' && (r.type || '') !== filters.type) return false;
      if (minCap != null && !(r.capacityMWe != null && r.capacityMWe >= minCap)) return false;
      if (maxCap != null && !(r.capacityMWe != null && r.capacityMWe <= maxCap)) return false;
      if (!q) return true;
      const hay = `${r.name} ${r.plant} ${r.country} ${r.type || ''} ${r.operator || ''}`.toLowerCase();
      return hay.includes(q);
    });

    out = out.slice().sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      if (filters.sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      if (filters.sortKey === 'status') return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir;
      // capacity
      const ac = a.capacityMWe ?? -1;
      const bc = b.capacityMWe ?? -1;
      return (ac - bc) * dir;
    });

    return out;
  }, [reactors, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  // Reset to first page when filters change materially.
  useEffect(() => {
    setPage(1);
  }, [
    filters.q,
    filters.status,
    filters.country,
    filters.type,
    filters.minCapacity,
    filters.maxCapacity,
    filters.sortKey,
    filters.sortDir,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Directory • Searchable"
        title="Reactor Directory"
        subtitle="Search, filter, and sort reactors worldwide. Data is ingested and stored locally (no third-party calls at page load)."
        cta={{ href: '/map', label: 'Open map' }}
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="font-semibold">Directory failed to load</div>
          <div className="text-muted-foreground mt-1">{error}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-6">
              <input
                className="h-10 rounded-md border bg-white px-3 text-sm md:col-span-2"
                placeholder="Search name, plant, operator..."
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              />
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value as DirectoryFilters['status'] }))
                }
              >
                <option value="all">All statuses</option>
                {(
                  [
                    ['operating', 'Operating'],
                    ['suspended', 'Suspended / Offline'],
                    ['under_construction', 'Under Construction'],
                    ['planned', 'Planned'],
                    ['shutdown', 'Shutdown'],
                  ] as const
                ).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={filters.country}
                onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
              >
                <option value="all">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 md:col-span-1">
                <input
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  inputMode="numeric"
                  placeholder="Min MWe"
                  value={filters.minCapacity}
                  onChange={(e) => setFilters((f) => ({ ...f, minCapacity: e.target.value }))}
                />
                <input
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  inputMode="numeric"
                  placeholder="Max MWe"
                  value={filters.maxCapacity}
                  onChange={(e) => setFilters((f) => ({ ...f, maxCapacity: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> reactors
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Sort</span>
                <select
                  className="h-9 rounded-md border bg-white px-2 text-sm"
                  value={`${filters.sortKey}:${filters.sortDir}`}
                  onChange={(e) => {
                    const [sortKey, sortDir] = e.target.value.split(':') as [SortKey, SortDir];
                    setFilters((f) => ({ ...f, sortKey, sortDir }));
                  }}
                >
                  <option value="capacity:desc">Capacity (high to low)</option>
                  <option value="capacity:asc">Capacity (low to high)</option>
                  <option value="name:asc">Name (A to Z)</option>
                  <option value="name:desc">Name (Z to A)</option>
                  <option value="status:asc">Status</option>
                </select>
                <button
                  className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-slate-50"
                  onClick={() =>
                    setFilters({
                      q: '',
                      status: 'all',
                      country: 'all',
                      type: 'all',
                      minCapacity: '',
                      maxCapacity: '',
                      sortKey: 'capacity',
                      sortDir: 'desc',
                    })
                  }
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No reactors match these filters.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr className="border-b">
                      <th className="text-left font-semibold px-4 py-3">Name</th>
                      <th className="text-left font-semibold px-4 py-3">Plant</th>
                      <th className="text-left font-semibold px-4 py-3">Country</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="text-right font-semibold px-4 py-3">Capacity (MWe)</th>
                      <th className="text-left font-semibold px-4 py-3">Type</th>
                      <th className="text-left font-semibold px-4 py-3">Operator</th>
                      <th className="text-left font-semibold px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link className="font-medium hover:underline" href={`/reactors/${r.id}`}>
                            {r.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.plant}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.country}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={r.status} compact />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {r.capacityMWe != null ? r.capacityMWe.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.type || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.operator || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                Page <span className="font-medium text-foreground">{pageClamped}</span> of{' '}
                <span className="font-medium text-foreground">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="h-9 rounded-md border bg-white px-3 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pageClamped <= 1}
                >
                  Previous
                </button>
                <button
                  className="h-9 rounded-md border bg-white px-3 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageClamped >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
