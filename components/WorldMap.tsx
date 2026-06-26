'use client';

import * as React from 'react';
import { LOCAL_REACTORS } from '../lib/reactors/localData';
import type { Reactor } from '../lib/reactors/types';

type GlobeMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
};

type ArcLink = {
  from: GlobeMarker;
  to: GlobeMarker;
  color: string;
  altitude: number;
};

type WorldMapProps = {
  compact?: boolean;
  markers?: GlobeMarker[];
};

const DEFAULT_MARKERS: GlobeMarker[] = [];

function WorldMap({ compact = false, markers = DEFAULT_MARKERS }: WorldMapProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const globeRef = React.useRef<any>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  const reactorMarkers = React.useMemo(() => normalizeReactorMarkers(LOCAL_REACTORS), []);
  const visibleMarkers = React.useMemo(() => (markers.length ? markers : reactorMarkers), [markers, reactorMarkers]);
  const arcs = React.useMemo(() => buildArcs(visibleMarkers), [visibleMarkers]);

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
        .pointLabel((d: any) => d.label || d.id)
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
        .arcStartLat(((d: ArcLink) => d.from.lat) as any)
        .arcStartLng(((d: ArcLink) => d.from.lng) as any)
        .arcEndLat(((d: ArcLink) => d.to.lat) as any)
        .arcEndLng(((d: ArcLink) => d.to.lng) as any)
        .arcColor(((d: ArcLink) => d.color) as any)
        .arcAltitude(((d: ArcLink) => d.altitude) as any)
        .arcStroke(0.75)
        .arcDashLength(0.42)
        .arcDashGap(1.6)
        .arcDashAnimateTime(3200)
        .arcsTransitionDuration(0)
        .arcsData(arcs)
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
    globeRef.current.arcsData(arcs);
  }, [arcs, visibleMarkers]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: compact ? 520 : 760,
        borderRadius: 28,
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        boxShadow: '0 30px 90px rgba(2, 6, 23, 0.52)',
        background:
          'radial-gradient(circle at 30% 24%, rgba(56, 189, 248, 0.16) 0%, rgba(15, 23, 42, 0) 38%), linear-gradient(180deg, #070e1a 0%, #02050b 100%)',
      }}
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
          We are using the globe.gl renderer now, so we can keep the reactor data on a proper globe and add the sites
          back in as the next layer.
        </p>
      </div>

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
        Drag to rotate the globe
      </div>
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

function buildArcs(markers: GlobeMarker[]) {
  if (markers.length < 2) {
    return [];
  }

  const sorted = [...markers].sort((a, b) => a.id.localeCompare(b.id));
  const arcs: ArcLink[] = [];

  for (let index = 0; index < Math.min(sorted.length - 1, 34); index += 1) {
    const from = sorted[index];
    const to = sorted[(index + 1) % sorted.length];
    arcs.push({
      from,
      to,
      color: index % 2 === 0 ? 'rgba(56, 189, 248, 0.28)' : 'rgba(59, 130, 246, 0.20)',
      altitude: 0.12 + (index % 5) * 0.018,
    });
  }

  return arcs;
}

export default WorldMap;
