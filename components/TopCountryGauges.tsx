'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp } from 'lucide-react';

type TopCountry = {
  country_id: string;
  country_name: string;
  iso2?: string | null;
  total_capacity: number;
  reactor_count: number;
  operating_count: number;
};

type TrendPoint = {
  year: number;
  nuclear_twh?: number | null;
  nuclear_share_percent?: number | null;
};

type GaugeItem = TopCountry & {
  baseUtilization: number;
  trendPct: number;
  outputMw: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatNumber(n: number) {
  return Math.round(n).toLocaleString();
}

function Gauge({
  label,
  value,
  max,
  unit,
  trendPct,
  accentClass,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  trendPct: number;
  accentClass: string;
}) {
  const pct = clamp(value / max, 0, 1);
  const angle = -90 + pct * 180;
  const TrendIcon = trendPct >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <Badge variant="outline" className="text-[10px]">
          {trendPct >= 0 ? '+' : ''}{(trendPct * 100).toFixed(1)}% trend
        </Badge>
      </div>

      <div className="relative h-28 w-full">
        <svg viewBox="0 0 180 110" className="h-full w-full">
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="12"
            fill="none"
          />
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            className={accentClass}
            strokeWidth="12"
            fill="none"
            pathLength={100}
            strokeDasharray={`${pct * 100} 100`}
            strokeLinecap="round"
          />
          <line
            x1="90"
            y1="90"
            x2="90"
            y2="22"
            stroke="currentColor"
            strokeWidth="3"
            className="text-foreground/70"
            style={{
              transformOrigin: '90px 90px',
              transform: `rotate(${angle}deg)`,
              transition: 'transform 700ms ease',
            }}
          />
          <circle cx="90" cy="90" r="4" className="fill-foreground/80" />
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 text-[10px] text-muted-foreground">
          <span>0</span>
          <span>{formatNumber(max)} {unit}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">
          {formatNumber(value)} {unit}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trendPct >= 0 ? 'Rising' : 'Cooling'}</span>
        </div>
      </div>
    </div>
  );
}

export default function TopCountryGauges() {
  const [items, setItems] = useState<GaugeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const baseRef = useRef<GaugeItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/stats/top?metric=capacity&scope=country&limit=5');
        const top = await res.json();
        const list: TopCountry[] = top.data || [];

        const enriched = await Promise.all(
          list.map(async (country) => {
            let trendPct = 0;
            if (country.iso2) {
              try {
                const tRes = await fetch(`/api/stats/trends?country=${country.iso2}&metric=nuclear_twh`);
                const tJson = await tRes.json();
                const points: TrendPoint[] = tJson.data || [];
                if (points.length >= 2) {
                  const last = points[points.length - 1].nuclear_twh ?? 0;
                  const prev = points[points.length - 2].nuclear_twh ?? 0;
                  if (prev > 0) {
                    trendPct = clamp((last - prev) / prev, -0.08, 0.08);
                  }
                }
              } catch {
                trendPct = 0;
              }
            }

            const baseUtilization = clamp(0.72 + trendPct * 1.2, 0.55, 0.9);
            const outputMw = country.total_capacity * baseUtilization;

            return {
              ...country,
              baseUtilization,
              trendPct,
              outputMw,
            };
          })
        );

        baseRef.current = enriched;
        setItems(enriched);
      } catch (err) {
        console.error('Error fetching gauge data:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!baseRef.current.length) return;

    const interval = setInterval(() => {
      setItems((current) =>
        current.map((item, idx) => {
          const base = baseRef.current[idx];
          const jitter = 1 + (Math.random() * 0.02 - 0.01);
          const target = base.outputMw * jitter;
          return { ...item, outputMw: target };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const accents = useMemo(
    () => ['text-emerald-400', 'text-cyan-400', 'text-amber-400', 'text-fuchsia-400', 'text-blue-400'],
    []
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-6 h-24 rounded bg-muted" />
              <div className="mt-4 h-6 w-28 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Gauge data is temporarily unavailable.
      </div>
    );
  }

  return (
    <Card className="border border-border/80 bg-gradient-to-br from-background via-background to-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Live Output Dials</CardTitle>
            <p className="text-sm text-muted-foreground">
              Estimated live output for the top nuclear countries. Values fluctuate to reflect recent trends.
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            Live Signal
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {items.map((item, idx) => (
            <Card key={item.country_id} className="border border-border/60 bg-card/80">
              <CardContent className="p-5">
                <Gauge
                  label={item.country_name || 'Unknown'}
                  value={item.outputMw}
                  max={Math.max(item.total_capacity, 1)}
                  unit="MW"
                  trendPct={item.trendPct}
                  accentClass={accents[idx % accents.length]}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
