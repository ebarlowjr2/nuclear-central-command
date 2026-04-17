'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import type { Reactor, ReactorStatus } from '@/lib/reactors/types';

type Filters = {
  status: ReactorStatus | 'all';
  country: string | 'all';
  type: string | 'all';
  q: string;
};

const STATUS_LABEL: Record<ReactorStatus, string> = {
  operating: 'Operating',
  suspended: 'Suspended / Offline',
  shutdown: 'Shutdown',
  under_construction: 'Under Construction',
  planned: 'Planned',
};

function statusColor(status: ReactorStatus): string {
  switch (status) {
    case 'operating':
      return '#18B6A4'; // green-ish accent
    case 'suspended':
      return '#F5B942'; // highlight yellow
    case 'under_construction':
      return '#1479FF'; // primary blue
    case 'planned':
      return '#7C3AED'; // purple for planned
    case 'shutdown':
    default:
      return '#94A3B8'; // gray
  }
}

function markerIcon(status: ReactorStatus) {
  const color = statusColor(status);
  return L.divIcon({
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="
      width:14px;height:14px;border-radius:999px;
      background:${color};
      border:2px solid #ffffff;
      box-shadow:0 8px 18px rgba(0,0,0,0.18);
    "></div>`,
  });
}

export default function WorldMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    country: 'all',
    type: 'all',
    q: '',
  });

  useEffect(() => {
    let alive = true;
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
        if (alive) setReactors(list);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load reactor data.';
        if (alive) setError(message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchReactors();
    return () => {
      alive = false;
    };
  }, []);

  const countries = useMemo(() => {
    return Array.from(new Set(reactors.map((r) => r.country).filter(Boolean))).sort();
  }, [reactors]);

  const types = useMemo(() => {
    return Array.from(new Set(reactors.map((r) => r.type).filter(Boolean) as string[])).sort();
  }, [reactors]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return reactors.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.country !== 'all' && r.country !== filters.country) return false;
      if (filters.type !== 'all' && (r.type || '') !== filters.type) return false;
      if (!q) return true;
      const hay = `${r.name} ${r.plant} ${r.country} ${r.type || ''} ${r.operator || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reactors, filters]);

  const mappable = useMemo(
    () => filtered.filter((r) => typeof r.lat === 'number' && typeof r.lng === 'number'),
    [filtered]
  );

  const unmapped = useMemo(
    () => filtered.filter((r) => !(typeof r.lat === 'number' && typeof r.lng === 'number')),
    [filtered]
  );

  function panTo(reactor: Reactor) {
    if (!mapRef.current) return;
    if (typeof reactor.lat !== 'number' || typeof reactor.lng !== 'number') return;
    mapRef.current.setView([reactor.lat, reactor.lng], Math.max(mapRef.current.getZoom(), 5), {
      animate: true,
    });
  }

  if (loading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center text-muted-foreground">
        Loading reactor data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center">
        <div className="max-w-xl text-center space-y-2">
          <p className="font-semibold">Map data failed to load</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            The app falls back to a local dataset when Supabase is not configured. If you still see
            this error, check your server logs.
          </p>
        </div>
      </div>
    );
  }

  // Never render an "empty map" with no explanation.
  if (reactors.length === 0) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center text-muted-foreground">
        No reactor data available.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="h-[600px] w-full overflow-hidden rounded-lg border">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          ref={(instance) => {
            mapRef.current = instance;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup chunkedLoading>
            {mappable.map((reactor) => (
              <Marker
                key={reactor.id}
                position={[reactor.lat as number, reactor.lng as number]}
                icon={markerIcon(reactor.status)}
              >
                <Popup>
                  <div className="p-1">
                    <div className="font-semibold">{reactor.name}</div>
                    <div className="text-sm text-slate-700">{reactor.country}</div>
                    <div className="text-sm">
                      <span className="font-medium">Status:</span> {STATUS_LABEL[reactor.status]}
                    </div>
                    {reactor.capacityMWe != null && (
                      <div className="text-sm">
                        <span className="font-medium">Capacity:</span> {reactor.capacityMWe} MWe
                      </div>
                    )}
                    {reactor.type && (
                      <div className="text-sm">
                        <span className="font-medium">Type:</span> {reactor.type}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <div className="rounded-lg border bg-white p-4 h-[600px] overflow-auto">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold">Filters</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                className="h-9 rounded-md border bg-white px-2 text-sm"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value as Filters['status'] }))
                }
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-white px-2 text-sm"
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
                className="h-9 rounded-md border bg-white px-2 text-sm col-span-2"
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="all">All reactor types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="h-9 rounded-md border bg-white px-2 text-sm col-span-2"
                placeholder="Search plant, unit, operator..."
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Showing {filtered.length} reactors ({mappable.length} on map, {unmapped.length} without
              coordinates).
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-sm font-semibold">Reactor List</div>
            <div className="mt-2 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground py-10 text-center">
                  No reactors match these filters.
                </div>
              ) : (
                filtered.map((r) => {
                  const hasCoords = typeof r.lat === 'number' && typeof r.lng === 'number';
                  return (
                    <button
                      key={r.id}
                      className="w-full text-left rounded-md border px-3 py-2 hover:bg-slate-50 transition"
                      onClick={() => panTo(r)}
                      disabled={!hasCoords}
                      title={hasCoords ? 'Pan map to reactor' : 'No coordinates available'}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{r.name}</div>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full border"
                          style={{
                            borderColor: statusColor(r.status),
                            color: '#0F172A',
                            background: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.country}
                        {r.capacityMWe != null ? ` • ${r.capacityMWe} MWe` : ''}
                        {r.type ? ` • ${r.type}` : ''}
                        {!hasCoords ? ' • (no coordinates)' : ''}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
