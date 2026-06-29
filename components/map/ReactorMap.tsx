'use client';

import 'leaflet/dist/leaflet.css';
import * as React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LOCAL_REACTORS } from '@/lib/reactors/localData';
import type { Reactor, ReactorStatus } from '@/lib/reactors/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReactorMapPoint = {
  id: string;
  name: string;
  plantName: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
  status: ReactorStatus;
  capacityMWe?: number | null;
  reactorType?: string;
  operator?: string;
  source?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ReactorStatus,
  { label: string; color: string; fillColor: string }
> = {
  operating: { label: 'Operating', color: '#059669', fillColor: '#10b981' },
  under_construction: { label: 'Under Construction', color: '#b45309', fillColor: '#f59e0b' },
  planned: { label: 'Planned', color: '#1d4ed8', fillColor: '#60a5fa' },
  suspended: { label: 'Suspended', color: '#7c3aed', fillColor: '#a78bfa' },
  shutdown: { label: 'Shutdown', color: '#6b7280', fillColor: '#9ca3af' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ReactorStatus[];

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function toMapPoints(reactors: Reactor[]): ReactorMapPoint[] {
  return reactors
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      plantName: r.plant,
      country: r.country,
      lat: r.lat as number,
      lng: r.lng as number,
      status: r.status,
      capacityMWe: r.capacityMWe,
      reactorType: r.type,
      operator: r.operator,
      source: r.source,
    }));
}

const ALL_POINTS = toMapPoints(LOCAL_REACTORS);

// ---------------------------------------------------------------------------
// URL state helpers
// ---------------------------------------------------------------------------

function parseStatuses(raw: string | null): Set<ReactorStatus> {
  if (!raw) return new Set(ALL_STATUSES);
  const parts = raw.split(',').filter((s) => ALL_STATUSES.includes(s as ReactorStatus));
  return parts.length ? new Set(parts as ReactorStatus[]) : new Set(ALL_STATUSES);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FitBoundsOnLoad({ points }: { points: ReactorMapPoint[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    const bounds = points.map((p) => [p.lat, p.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, []); // only on mount
  return null;
}

function DetailPanel({
  reactor,
  onClose,
}: {
  reactor: ReactorMapPoint;
  onClose: () => void;
}) {
  const cfg = STATUS_CONFIG[reactor.status] ?? STATUS_CONFIG.operating;
  return (
    <aside
      style={{
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 1000,
        width: 'min(360px, calc(100vw - 32px))',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        border: '1px solid #e2e8f0',
        padding: 20,
        color: '#0f172a',
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          right: 14,
          top: 14,
          width: 28,
          height: 28,
          border: '1px solid #e2e8f0',
          borderRadius: 999,
          background: '#f8fafc',
          cursor: 'pointer',
          fontSize: 16,
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>

      <div style={{ paddingRight: 36 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 999,
            background: cfg.fillColor + '22',
            border: `1px solid ${cfg.fillColor}55`,
            color: cfg.color,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: cfg.fillColor,
            }}
          />
          {cfg.label}
        </span>

        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
          {reactor.name}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          {reactor.plantName !== reactor.name ? reactor.plantName : null}
          {reactor.country}
        </p>
      </div>

      <dl style={{ display: 'grid', gap: 0, margin: 0 }}>
        {[
          ['Capacity', reactor.capacityMWe != null ? `${reactor.capacityMWe.toLocaleString()} MWe` : null],
          ['Reactor type', reactor.reactorType],
          ['Operator', reactor.operator],
          ['Coordinates', `${reactor.lat.toFixed(4)}, ${reactor.lng.toFixed(4)}`],
        ].map(([label, value]) =>
          value ? (
            <div
              key={label as string}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr',
                gap: 8,
                padding: '9px 0',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              <dt style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </dt>
              <dd style={{ margin: 0, fontSize: 14, color: '#1e293b', overflowWrap: 'anywhere' }}>
                {value}
              </dd>
            </div>
          ) : null
        )}
      </dl>

      {reactor.source && (
        <a
          href={reactor.source}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 14,
            fontSize: 12,
            color: '#3b82f6',
            fontWeight: 600,
          }}
        >
          View source ↗
        </a>
      )}
    </aside>
  );
}

function LayerPanel({
  activeStatuses,
  counts,
  onToggle,
}: {
  activeStatuses: Set<ReactorStatus>;
  counts: Record<ReactorStatus, number>;
  onToggle: (s: ReactorStatus) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 14,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid #e2e8f0',
        padding: '14px 16px',
        minWidth: 200,
      }}
    >
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#64748b',
        }}
      >
        Layers
      </p>
      <div style={{ display: 'grid', gap: 6 }}>
        {ALL_STATUSES.filter((s) => counts[s] > 0).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const active = activeStatuses.has(status);
          return (
            <button
              key={status}
              type="button"
              onClick={() => onToggle(status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 8px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: active ? cfg.fillColor + '55' : '#e2e8f0',
                background: active ? cfg.fillColor + '15' : '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                opacity: active ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: active ? cfg.fillColor : '#cbd5e1',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: '#1e293b', flex: 1 }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{counts[status]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 16,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 'min(380px, calc(100vw - 256px))',
      }}
    >
      <input
        type="search"
        placeholder="Search reactors, plants, countries…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          fontSize: 14,
          color: '#0f172a',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function StatusBar({ filtered, total }: { filtered: number; total: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 20,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.94)',
        borderRadius: 999,
        border: '1px solid #e2e8f0',
        padding: '6px 16px',
        fontSize: 12,
        color: '#475569',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        whiteSpace: 'nowrap',
      }}
    >
      Showing <strong style={{ color: '#0f172a' }}>{filtered}</strong> of{' '}
      <strong style={{ color: '#0f172a' }}>{total}</strong> reactor sites with coordinates
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReactorMap() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeStatuses, setActiveStatuses] = React.useState<Set<ReactorStatus>>(
    () => parseStatuses(searchParams.get('status'))
  );
  const [search, setSearch] = React.useState(searchParams.get('q') ?? '');
  const [selected, setSelected] = React.useState<ReactorMapPoint | null>(null);

  // Sync URL state
  React.useEffect(() => {
    const params = new URLSearchParams();
    const all = new Set(ALL_STATUSES.filter((s) => counts[s] > 0));
    const active = new Set([...activeStatuses].filter((s) => all.has(s)));
    // Only write status param if not all are selected
    const allActive = [...all].every((s) => active.has(s));
    if (!allActive) params.set('status', [...active].join(','));
    if (search) params.set('q', search);
    const qs = params.toString();
    router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false });
  }, [activeStatuses, search]);

  // Counts per status in full dataset
  const counts = React.useMemo(() => {
    const c = {} as Record<ReactorStatus, number>;
    for (const s of ALL_STATUSES) c[s] = 0;
    for (const p of ALL_POINTS) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, []);

  // Filtered points
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_POINTS.filter((p) => {
      if (!activeStatuses.has(p.status)) return false;
      if (q && !`${p.name} ${p.plantName} ${p.country}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeStatuses, search]);

  const toggleStatus = (s: ReactorStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
    setSelected(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, top: 64, zIndex: 0 }}>
      <MapContainer
        center={[25, 10]}
        zoom={3}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <FitBoundsOnLoad points={ALL_POINTS} />

        {filtered.map((p) => {
          const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.operating;
          const isSelected = selected?.id === p.id;
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={isSelected ? 9 : 6}
              pathOptions={{
                color: cfg.color,
                fillColor: cfg.fillColor,
                fillOpacity: 0.85,
                weight: isSelected ? 2.5 : 1.5,
              }}
              eventHandlers={{
                click: () => setSelected(isSelected ? null : p),
              }}
            >
              <Popup>
                <strong>{p.name}</strong>
                <br />
                <span style={{ color: '#64748b', fontSize: 12 }}>{p.country}</span>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Attribution (custom position) */}
      <div
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          zIndex: 1000,
          fontSize: 10,
          color: '#94a3b8',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 4,
          padding: '2px 6px',
        }}
      >
        © OpenStreetMap · CARTO · IAEA PRIS
      </div>

      <LayerPanel activeStatuses={activeStatuses} counts={counts} onToggle={toggleStatus} />
      <SearchBar value={search} onChange={setSearch} />
      {selected && <DetailPanel reactor={selected} onClose={() => setSelected(null)} />}
      <StatusBar filtered={filtered.length} total={ALL_POINTS.length} />
    </div>
  );
}
