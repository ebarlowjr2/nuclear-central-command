'use client';

import * as React from 'react';
import { LOCAL_REACTORS } from '../lib/reactors/localData';
import type { Reactor } from '../lib/reactors/types';

type GlobeMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  plant?: string;
  country?: string;
  status?: Reactor['status'];
  capacityMWe?: number | null;
  reactorType?: string;
  operator?: string;
  source?: string;
  color?: string;
};

type WorldMapProps = {
  compact?: boolean;
  fullScreen?: boolean;
  markers?: GlobeMarker[];
};

const DEFAULT_MARKERS: GlobeMarker[] = [];

function WorldMap({ compact = false, fullScreen = false, markers = DEFAULT_MARKERS }: WorldMapProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const globeRef = React.useRef<any>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const [selectedMarker, setSelectedMarker] = React.useState<GlobeMarker | null>(null);

  const reactorMarkers = React.useMemo(() => normalizeReactorMarkers(LOCAL_REACTORS), []);
  const visibleMarkers = React.useMemo(() => (markers.length ? markers : reactorMarkers), [markers, reactorMarkers]);

  React.useEffect(() => {
    let cancelled = false;

    const mountGlobe = async () => {
      const host = hostRef.current;
      if (!host) return;

      const [{ default: Globe }] = await Promise.all([import('globe.gl')]);
      if (cancelled || !hostRef.current) return;

      host.innerHTML = '';

      const globe: any = new Globe(hostRef.current, {
        rendererConfig: { antialias: true, alpha: true },
        waitForGlobeReady: true,
        animateIn: true,
      });

      globeRef.current = globe;

      globe
        .backgroundColor('#020617')
        .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
        .showGlobe(true)
        .showAtmosphere(true)
        .atmosphereColor('#38bdf8')
        .atmosphereAltitude(0.2)
        .showGraticules(true)
        .width(host.clientWidth)
        .height(host.clientHeight)
        .globeOffset([0, 0])
        .pointAltitude(0.02)
        .pointRadius(0.26)
        .pointColor((d: any) => d.color || '#fbbf24')
        .pointLabel((d: any) => markerTooltip(d))
        .onPointClick((d: any) => setSelectedMarker(d as GlobeMarker))
        .pointsData(visibleMarkers)
        .pointsTransitionDuration(0)
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelText((d: any) => d.label || d.id)
        .labelColor((d: any) => d.color || '#dbeafe')
        .labelSize((d: any) => (d.label ? Math.max(0.35, Math.min(0.75, 0.28 + d.label.length * 0.012)) : 0.45))
        .labelDotRadius(0.08)
        .labelIncludeDot(true)
        .labelResolution(2)
        .labelsTransitionDuration(0)
        .labelsData(visibleMarkers)
        .onLabelClick((d: any) => setSelectedMarker(d as GlobeMarker))
        .arcsData([])
        .pointOfView({ lat: 20, lng: -25, altitude: 2.15 }, 0);

      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = compact ? 0.38 : 0.28;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minDistance = 180;
      controls.maxDistance = 380;

      const resize = () => {
        const rect = host.getBoundingClientRect();
        globe.width(rect.width);
        globe.height(rect.height);
      };

      resize();

      resizeObserverRef.current = new ResizeObserver(() => {
        resize();
      });
      resizeObserverRef.current.observe(host);
    };

    void mountGlobe();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      globeRef.current?._destructor?.();
      globeRef.current = null;
    };
  }, [compact]);

  React.useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointsData(visibleMarkers);
    globeRef.current.labelsData(visibleMarkers);
    globeRef.current.arcsData([]);
  }, [visibleMarkers]);

  return (
    <div
      style={
        fullScreen
          ? { position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }
          : {
              position: 'relative',
              width: '100%',
              minHeight: compact ? 520 : 760,
              borderRadius: 28,
              overflow: 'hidden',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              boxShadow: '0 30px 90px rgba(2, 6, 23, 0.52)',
              background:
                'radial-gradient(circle at 30% 24%, rgba(56, 189, 248, 0.16) 0%, rgba(15, 23, 42, 0) 38%), linear-gradient(180deg, #070e1a 0%, #02050b 100%)',
            }
      }
    >
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />

      <div
        style={{
          position: 'absolute',
          inset: '8% 8% auto auto',
          width: '44%',
          height: '64%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 12%, rgba(255,255,255,0.02) 23%, rgba(255,255,255,0) 48%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          filter: 'blur(4px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 28,
          top: 28,
          maxWidth: 460,
          color: '#f8fafc',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#93c5fd' }}>
          Reactor globe
        </div>
        <h2 style={{ margin: '10px 0 8px', fontSize: compact ? 26 : 34, lineHeight: 1.05 }}>
          Globe surface is live.
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
          Reactor sites are plotted from the local dataset. Click a site marker or label to inspect plant details.
        </p>
      </div>

      {selectedMarker && (
        <aside
          style={{
            position: 'absolute',
            right: 24,
            top: 24,
            width: 'min(360px, calc(100% - 48px))',
            borderRadius: 18,
            border: '1px solid rgba(203, 213, 225, 0.22)',
            background: 'rgba(8, 13, 24, 0.88)',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.44)',
            color: '#f8fafc',
            padding: 18,
            backdropFilter: 'blur(14px)',
          }}
        >
          <button
            type="button"
            aria-label="Close reactor details"
            onClick={() => setSelectedMarker(null)}
            style={{
              position: 'absolute',
              right: 14,
              top: 12,
              width: 30,
              height: 30,
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.74)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: '26px',
            }}
          >
            ×
          </button>

          <div style={{ paddingRight: 36 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                color: selectedMarker.color || '#34d399',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: selectedMarker.color || '#34d399',
                  boxShadow: `0 0 12px ${selectedMarker.color || '#34d399'}`,
                }}
              />
              {formatStatus(selectedMarker.status)}
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: 24, lineHeight: 1.15 }}>{selectedMarker.label}</h3>
            <p style={{ margin: '0 0 16px', color: '#cbd5e1', fontSize: 14 }}>{selectedMarker.plant}</p>
          </div>

          <dl style={{ display: 'grid', gap: 10, margin: 0 }}>
            <DetailRow label="Country" value={selectedMarker.country} />
            <DetailRow label="Capacity" value={formatCapacity(selectedMarker.capacityMWe)} />
            <DetailRow label="Type" value={selectedMarker.reactorType} />
            <DetailRow label="Operator" value={selectedMarker.operator} />
            <DetailRow label="Coordinates" value={`${selectedMarker.lat.toFixed(3)}, ${selectedMarker.lng.toFixed(3)}`} />
          </dl>

          {selectedMarker.source && (
            <a
              href={selectedMarker.source}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                marginTop: 16,
                color: '#93c5fd',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              View source
            </a>
          )}
        </aside>
      )}

      <div
        style={{
          position: 'absolute',
          left: 28,
          bottom: 24,
          display: 'inline-flex',
          gap: 10,
          alignItems: 'center',
          padding: '10px 14px',
          borderRadius: 999,
          background: 'rgba(15, 23, 42, 0.72)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          color: '#dbeafe',
          fontSize: 12,
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
        {visibleMarkers.length} reactor sites
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px minmax(0, 1fr)',
        gap: 12,
        alignItems: 'baseline',
        borderTop: '1px solid rgba(148, 163, 184, 0.14)',
        paddingTop: 10,
      }}
    >
      <dt style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase' }}>{label}</dt>
      <dd style={{ margin: 0, color: '#e2e8f0', fontSize: 14, overflowWrap: 'anywhere' }}>{value || 'Unknown'}</dd>
    </div>
  );
}

function normalizeReactorMarkers(reactors: Reactor[]): GlobeMarker[] {
  return reactors
    .filter((reactor) => reactor.lat !== null && reactor.lng !== null)
    .map((reactor) => ({
      id: reactor.id,
      lat: reactor.lat as number,
      lng: reactor.lng as number,
      label: reactor.name || reactor.plant,
      plant: reactor.plant,
      country: reactor.country,
      status: reactor.status,
      capacityMWe: reactor.capacityMWe,
      reactorType: reactor.type,
      operator: reactor.operator,
      source: reactor.source,
      color: reactorColor(reactor.status),
    }));
}

function reactorColor(status: Reactor['status']) {
  switch (status) {
    case 'operating':
      return '#34d399';
    case 'under_construction':
      return '#f59e0b';
    case 'planned':
      return '#fbbf24';
    case 'suspended':
    case 'shutdown':
    default:
      return '#7dd3fc';
  }
}

function markerTooltip(marker: GlobeMarker) {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 260px;">
      <strong style="display:block; margin-bottom: 4px;">${escapeHtml(marker.label || marker.id)}</strong>
      <span style="display:block; color:#cbd5e1;">${escapeHtml(marker.plant || 'Unknown plant')}</span>
      <span style="display:block; margin-top: 6px; color:${marker.color || '#34d399'};">${escapeHtml(formatStatus(marker.status))}</span>
    </div>
  `;
}

function formatStatus(status?: Reactor['status']) {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

function formatCapacity(capacityMWe?: number | null) {
  return typeof capacityMWe === 'number' ? `${capacityMWe.toLocaleString()} MWe` : undefined;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default WorldMap;
