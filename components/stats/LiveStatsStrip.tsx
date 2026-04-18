'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Reactor } from '@/lib/reactors/types';
import StatusPill from '@/components/badges/StatusPill';

type Stats = {
  total: number;
  countries: number;
  operatingCount: number;
  operatingMWe: number;
  byStatus: Record<Reactor['status'], number>;
};

function formatInt(n: number) {
  return Math.round(n).toLocaleString();
}

export default function LiveStatsStrip() {
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reactors/list?limit=5000');
        if (!res.ok) throw new Error(await res.text());
        const data: unknown = await res.json();
        const list = (() => {
          if (!data || typeof data !== 'object') return [];
          const maybe = (data as Record<string, unknown>).data;
          return Array.isArray(maybe) ? (maybe as Reactor[]) : [];
        })();
        if (alive) setReactors(list);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load live stats.';
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

  const stats = useMemo<Stats>(() => {
    const byStatus: Stats['byStatus'] = {
      operating: 0,
      suspended: 0,
      under_construction: 0,
      planned: 0,
      shutdown: 0,
    };

    let operatingMWe = 0;
    const countrySet = new Set<string>();

    for (const r of reactors) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      if (r.country) countrySet.add(r.country);
      if (r.status === 'operating' && r.capacityMWe != null) operatingMWe += r.capacityMWe;
    }

    return {
      total: reactors.length,
      countries: countrySet.size,
      operatingCount: byStatus.operating,
      operatingMWe,
      byStatus,
    };
  }, [reactors]);

  return (
    <div className="rounded-2xl border bg-white/75 backdrop-blur px-5 py-4">
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading live stats…</div>
      ) : error ? (
        <div className="text-sm text-muted-foreground">
          Live stats unavailable: {error}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border bg-white px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Reactors</div>
              <div className="text-lg font-semibold">{formatInt(stats.total)}</div>
            </div>
            <div className="rounded-xl border bg-white px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Countries</div>
              <div className="text-lg font-semibold">{formatInt(stats.countries)}</div>
            </div>
            <div className="rounded-xl border bg-white px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Operating MWe</div>
              <div className="text-lg font-semibold">{formatInt(stats.operatingMWe)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-muted-foreground mr-1">Fleet:</div>
            <div className="flex items-center gap-2">
              <StatusPill status="operating" compact />
              <span className="text-xs text-muted-foreground">{formatInt(stats.byStatus.operating)}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status="under_construction" compact />
              <span className="text-xs text-muted-foreground">{formatInt(stats.byStatus.under_construction)}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status="planned" compact />
              <span className="text-xs text-muted-foreground">{formatInt(stats.byStatus.planned)}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status="shutdown" compact />
              <span className="text-xs text-muted-foreground">{formatInt(stats.byStatus.shutdown)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

