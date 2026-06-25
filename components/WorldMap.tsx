'use client';

import * as React from 'react';

type GlobeMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
};

type WorldMapProps = {
  compact?: boolean;
  markers?: GlobeMarker[];
};

type Meridian = {
  id: string;
  d: string;
  opacity: number;
};

type Parallel = {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
};

const MARKER_FALLBACK: GlobeMarker[] = [];

function WorldMap({ compact = false, markers = MARKER_FALLBACK }: WorldMapProps) {
  const meridians = React.useMemo<Meridian[]>(() => {
    return [-120, -60, 0, 60, 120].map((angle) => ({
      id: `m-${angle}`,
      d: `M 50 6 C ${50 + Math.sin((angle * Math.PI) / 180) * 22} 24, ${50 + Math.sin((angle * Math.PI) / 180) * 28} 76, 50 94`,
      opacity: angle === 0 ? 0.26 : 0.16,
    }));
  }, []);

  const parallels = React.useMemo<Parallel[]>(() => {
    return [18, 34, 50, 66].map((lat, index) => ({
      id: `p-${lat}`,
      cx: 50,
      cy: 50,
      rx: 42 - index * 4.5,
      ry: 42 - index * 4.5,
      opacity: index === 0 ? 0.22 : 0.14,
    }));
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: compact ? 520 : 760,
        borderRadius: 32,
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        boxShadow: '0 30px 90px rgba(2, 6, 23, 0.45)',
        background: 'radial-gradient(circle at 50% 30%, #163a64 0%, #08111f 42%, #030712 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.22), transparent 34%), radial-gradient(circle at 70% 65%, rgba(14, 165, 233, 0.12), transparent 38%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          className="globe-shell"
          style={{
            position: 'relative',
            width: compact ? 'min(78vw, 520px)' : 'min(84vw, 720px)',
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 18%, rgba(9, 26, 46, 0.5) 44%, rgba(4, 10, 20, 0.95) 78%, rgba(2, 6, 23, 1) 100%)',
            boxShadow:
              'inset -28px -34px 80px rgba(2, 6, 23, 0.85), inset 18px 18px 50px rgba(125, 211, 252, 0.08), 0 0 0 1px rgba(148, 163, 184, 0.18), 0 0 120px rgba(59, 130, 246, 0.14)',
            animation: 'globe-spin 26s linear infinite',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '6%',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 20%, rgba(0,0,0,0) 44%)',
            }}
          />

          <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <clipPath id="globeClip">
                <circle cx="50" cy="50" r="50" />
              </clipPath>
            </defs>

            <g clipPath="url(#globeClip)">
              <rect x="0" y="0" width="100" height="100" fill="transparent" />
              {parallels.map((parallel) => (
                <ellipse
                  key={parallel.id}
                  cx={parallel.cx}
                  cy={parallel.cy}
                  rx={parallel.rx}
                  ry={parallel.ry}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.34)"
                  strokeWidth="0.7"
                  opacity={parallel.opacity}
                />
              ))}
              {meridians.map((meridian) => (
                <path
                  key={meridian.id}
                  d={meridian.d}
                  fill="none"
                  stroke="rgba(125, 211, 252, 0.35)"
                  strokeWidth="0.7"
                  opacity={meridian.opacity}
                />
              ))}

              <circle cx="50" cy="50" r="45.5" fill="none" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="0.8" />
            </g>
          </svg>

          {markers.slice(0, 0).map((marker) => (
            <span key={marker.id} />
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 24,
          top: 24,
          maxWidth: 420,
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
          We are using a clean globe shell first, then we will place reactor sites on top of it.
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 24,
          bottom: 22,
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
        Drag interaction will return with markers
      </div>

      <style jsx>{`
        @keyframes globe-spin {
          0% {
            transform: rotateY(0deg) rotateX(5deg);
          }
          100% {
            transform: rotateY(360deg) rotateX(5deg);
          }
        }

        .globe-shell:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

export default WorldMap;
