'use client';

import * as React from 'react';
import { LOCAL_REACTORS } from '../lib/reactors/localData';
import type { Reactor } from '../lib/reactors/types';

type ReactorLike = Record<string, unknown>;

type GlobePoint = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  status: string;
  country: string;
  powerMw: number | null;
  color: string;
};

type WorldMapProps = {
  compact?: boolean;
};

type Rotation = {
  yaw: number;
  pitch: number;
};

type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
};

const STATUS_COLORS: Record<string, string> = {
  operating: '#34d399',
  active: '#34d399',
  operational: '#34d399',
  planned: '#fbbf24',
  underConstruction: '#f59e0b',
  shutdown: '#94a3b8',
  retired: '#94a3b8',
  default: '#7dd3fc',
};

const NUMBER_KEYS = ['lat', 'latitude', 'latDeg', 'y'];
const LNG_KEYS = ['lng', 'lon', 'long', 'longitude', 'lngDeg', 'x'];
const NAME_KEYS = ['name', 'plantName', 'reactor', 'title', 'site', 'facility', 'unit'];
const COUNTRY_KEYS = ['country', 'nation', 'region'];
const STATUS_KEYS = ['status', 'operatingStatus', 'operationalStatus', 'state'];
const POWER_KEYS = ['powerMw', 'capacity', 'capacityMw', 'mwe', 'netCapacity', 'grossCapacity'];

function WorldMap({ compact = false }: WorldMapProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rotationRef = React.useRef<Rotation>({ yaw: 0.2, pitch: -0.12 });
  const dragRef = React.useRef({ dragging: false, x: 0, y: 0 });
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });
  const points = React.useMemo(() => normalizeReactorPoints(LOCAL_REACTORS), []);
  const stars = React.useMemo(() => buildStars(180), []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = {
        width: Math.max(320, rect.width),
        height: Math.max(440, rect.height),
        dpr,
      };
      canvas.width = Math.floor(sizeRef.current.width * dpr);
      canvas.height = Math.floor(sizeRef.current.height * dpr);
      canvas.style.width = `${sizeRef.current.width}px`;
      canvas.style.height = `${sizeRef.current.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    let animationFrame = 0;

    const render = () => {
      const { width, height } = sizeRef.current;
      const ctx = context;
      const centerX = width / 2;
      const centerY = height / 2;
      const globeRadius = Math.min(width, height) * (compact ? 0.31 : 0.34);
      const yaw = rotationRef.current.yaw;
      const pitch = rotationRef.current.pitch;

      ctx.clearRect(0, 0, width, height);

      const background = ctx.createRadialGradient(centerX * 0.95, centerY * 0.9, 20, centerX, centerY, Math.max(width, height));
      background.addColorStop(0, '#10233b');
      background.addColorStop(0.55, '#081220');
      background.addColorStop(1, '#030712');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      drawStars(ctx, stars, width, height, frame);
      drawGlow(ctx, centerX, centerY, globeRadius);

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.clip();

      drawOcean(ctx, centerX, centerY, globeRadius);
      drawGraticule(ctx, centerX, centerY, globeRadius, yaw, pitch);
      drawPoints(ctx, points, centerX, centerY, globeRadius, yaw, pitch, frame);

      ctx.restore();

      drawRim(ctx, centerX, centerY, globeRadius);
      drawCaption(ctx, width, height, points.length);

      frame += 1;
      if (!dragRef.current.dragging) {
        rotationRef.current.yaw += 0.0012;
      }
      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    const onPointerDown = (event: PointerEvent) => {
      dragRef.current.dragging = true;
      dragRef.current.x = event.clientX;
      dragRef.current.y = event.clientY;
      container.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      dragRef.current.x = event.clientX;
      dragRef.current.y = event.clientY;
      rotationRef.current.yaw += dx * 0.004;
      rotationRef.current.pitch = clamp(rotationRef.current.pitch + dy * 0.003, -1.15, 1.15);
    };

    const onPointerUp = (event: PointerEvent) => {
      dragRef.current.dragging = false;
      try {
        container.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore release errors when capture has already been cleared.
      }
    };

    const onPointerLeave = () => {
      dragRef.current.dragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [compact, points, stars]);

  const summary = React.useMemo(() => {
    const countries = new Set(points.map((point) => point.country || 'Unknown'));
    const totalMw = points.reduce((sum, point) => sum + (point.powerMw || 0), 0);

    return {
      countries: countries.size,
      totalMw,
      operating: points.filter((point) => /oper|active/i.test(point.status)).length,
    };
  }, [points]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: compact ? 440 : 720,
        borderRadius: 28,
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 30px 90px rgba(2, 6, 23, 0.45)',
        background: 'linear-gradient(180deg, #08101c 0%, #02060d 100%)',
        cursor: 'grab',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      <div
        style={{
          position: 'absolute',
          left: 22,
          top: 22,
          maxWidth: 360,
          color: '#f8fafc',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#93c5fd' }}>
          Reactor globe
        </div>
        <h2 style={{ margin: '10px 0 8px', fontSize: compact ? 26 : 34, lineHeight: 1.05 }}>
          Command centers mapped on a rotating Earth.
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
          Drag to rotate. Reactor locations are projected directly from your existing dataset.
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 18,
          bottom: 18,
          display: 'grid',
          gap: 10,
          gridTemplateColumns: compact ? '1fr' : 'repeat(3, minmax(92px, 1fr))',
          color: '#e2e8f0',
          pointerEvents: 'none',
        }}
      >
        <StatCard label="Sites" value={points.length.toString()} />
        <StatCard label="Countries" value={summary.countries.toString()} />
        <StatCard label="Operating" value={summary.operating.toString()} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 22,
          bottom: 18,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          pointerEvents: 'none',
          color: '#dbeafe',
          fontSize: 12,
        }}
      >
        <LegendDot color={STATUS_COLORS.operating} label="Operating" />
        <LegendDot color={STATUS_COLORS.planned} label="Planned" />
        <LegendDot color={STATUS_COLORS.shutdown} label="Shutdown" />
        <span style={{ opacity: 0.7 }}>Total capacity: {formatPower(summary.totalMw)}</span>
      </div>

      {points.length === 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#e2e8f0',
            textAlign: 'center',
            pointerEvents: 'none',
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No plotted reactor coordinates yet</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
              The globe loads, but the current dataset does not include enough latitude/longitude data to place any
              visible markers.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        minWidth: 92,
        padding: '10px 12px',
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.72)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: 999, background: color, boxShadow: `0 0 10px ${color}` }} />
      <span>{label}</span>
    </div>
  );
}

function buildStars(count: number): Star[] {
  const stars: Star[] = [];
  let seed = 1337;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < count; index += 1) {
    stars.push({
      x: random(),
      y: random(),
      radius: 0.4 + random() * 1.4,
      alpha: 0.12 + random() * 0.85,
    });
  }

  return stars;
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], width: number, height: number, frame: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  stars.forEach((star, index) => {
    const x = (star.x * width + Math.sin((frame + index) * 0.003) * 4) % width;
    const y = (star.y * height + Math.cos((frame + index) * 0.004) * 3) % height;
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(x < 0 ? x + width : x, y < 0 ? y + height : y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const glow = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * 1.55);
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
  glow.addColorStop(0.45, 'rgba(59, 130, 246, 0.10)');
  glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius * 1.6, y - radius * 1.6, radius * 3.2, radius * 3.2);
}

function drawOcean(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const ocean = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.3, radius * 0.1, x, y, radius);
  ocean.addColorStop(0, '#102a43');
  ocean.addColorStop(0.55, '#0b1b2f');
  ocean.addColorStop(1, '#06111f');
  ctx.fillStyle = ocean;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawRim(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const highlight = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.45, radius * 0.1, x, y, radius);
  highlight.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  highlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
  highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCaption(ctx: CanvasRenderingContext2D, width: number, height: number, count: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;
  const boxWidth = Math.min(330, width - 28);
  const boxHeight = 56;
  const x = width / 2 - boxWidth / 2;
  const y = height - boxHeight - 20;
  roundRect(ctx, x, y, boxWidth, boxHeight, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.fillText(`${count} reactor sites placed on a globe`, x + 16, y + 23);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillText('Drag to spin and inspect the reactor distribution worldwide.', x + 16, y + 42);
  ctx.restore();
}

function drawGraticule(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  yaw: number,
  pitch: number,
) {
  ctx.save();
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const segments = sampleCircle(lat, yaw, pitch, 72);
    strokeProjectedSegments(ctx, segments, centerX, centerY, radius, 'rgba(148, 163, 184, 0.16)');
  }
  for (let lng = -180; lng < 180; lng += 30) {
    const segments = sampleMeridian(lng, yaw, pitch, 72);
    strokeProjectedSegments(ctx, segments, centerX, centerY, radius, 'rgba(125, 211, 252, 0.12)');
  }
  ctx.restore();
}

function drawPoints(
  ctx: CanvasRenderingContext2D,
  points: GlobePoint[],
  centerX: number,
  centerY: number,
  radius: number,
  yaw: number,
  pitch: number,
  frame: number,
) {
  const projected = points
    .map((point) => {
      const rotated = rotatePoint(point.lat, point.lng, yaw, pitch);
      return { ...point, ...rotated };
    })
    .sort((a, b) => a.depth - b.depth);

  for (const point of projected) {
    if (point.depth <= 0) continue;

    const x = centerX + point.x * radius;
    const y = centerY - point.y * radius;
    const pulse = 0.6 + 0.4 * Math.sin((frame + point.id.length) * 0.08);
    const pointRadius = 1.8 + Math.min(3.8, Math.log10((point.powerMw || 0) + 10) * 0.8) * pulse;

    ctx.save();
    ctx.globalAlpha = clamp(0.28 + point.depth * 0.72, 0.2, 1);
    ctx.shadowColor = point.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.65 * point.depth;
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, pointRadius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function sampleCircle(lat: number, yaw: number, pitch: number, steps: number) {
  const samples: Array<{ x: number; y: number; depth: number }> = [];
  for (let step = 0; step <= steps; step += 1) {
    const lng = -180 + (360 * step) / steps;
    samples.push(rotatePoint(lat, lng, yaw, pitch));
  }
  return samples;
}

function sampleMeridian(lng: number, yaw: number, pitch: number, steps: number) {
  const samples: Array<{ x: number; y: number; depth: number }> = [];
  for (let step = 0; step <= steps; step += 1) {
    const lat = -90 + (180 * step) / steps;
    samples.push(rotatePoint(lat, lng, yaw, pitch));
  }
  return samples;
}

function strokeProjectedSegments(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number; depth: number }>,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    const alpha = clamp(((a.depth + b.depth) / 2) * 0.85 + 0.08, 0.05, 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX + a.x * radius, centerY - a.y * radius);
    ctx.lineTo(centerX + b.x * radius, centerY - b.y * radius);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.restore();
  }
}

function rotatePoint(lat: number, lng: number, yaw: number, pitch: number) {
  const phi = degToRad(90 - lat);
  const theta = degToRad(lng + 180);

  let x = Math.sin(phi) * Math.cos(theta);
  let y = Math.cos(phi);
  let z = Math.sin(phi) * Math.sin(theta);

  const yawCos = Math.cos(yaw);
  const yawSin = Math.sin(yaw);
  const pitchCos = Math.cos(pitch);
  const pitchSin = Math.sin(pitch);

  const x1 = x * yawCos - z * yawSin;
  const z1 = x * yawSin + z * yawCos;
  const y1 = y;

  const y2 = y1 * pitchCos - z1 * pitchSin;
  const z2 = y1 * pitchSin + z1 * pitchCos;

  x = x1;
  y = y2;
  z = z2;

  return { x, y, depth: (z + 1) / 2 };
}

function normalizeReactorPoints(items: Reactor[]): GlobePoint[] {
  return items
    .map((item, index) => normalizeReactorPoint(item, index))
    .filter((point): point is GlobePoint => Boolean(point));
}

function normalizeReactorPoint(item: Reactor, index: number): GlobePoint | null {
  const lat = item.lat;
  const lng = item.lng;

  if (lat === null || lng === null) {
    return null;
  }

  const title = item.name?.trim() || item.plant?.trim() || `Reactor ${index + 1}`;
  const status = item.status || 'operating';
  const country = item.country || 'Unknown';
  const powerMw = item.capacityMWe;
  const color = resolveStatusColor(status);

  return {
    id: item.id || `${title}-${index}`,
    title,
    lat,
    lng,
    status,
    country,
    powerMw,
    color,
  };
}

function resolveStatusColor(status: string) {
  const normalized = status.toLowerCase().replace(/\s+/g, '');
  if (normalized.includes('operat') || normalized.includes('active')) return STATUS_COLORS.operating;
  if (normalized.includes('plan')) return STATUS_COLORS.planned;
  if (normalized.includes('constr')) return STATUS_COLORS.underConstruction;
  if (normalized.includes('shut') || normalized.includes('retir')) return STATUS_COLORS.shutdown;
  return STATUS_COLORS.default;
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPower(value: number) {
  if (!value) return 'n/a';
  if (value >= 1000) return `${(value / 1000).toFixed(1)} GW`;
  return `${Math.round(value)} MW`;
}

function hexToRgba(color: string, alpha: number) {
  const hex = color.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
  const numeric = Number.parseInt(normalized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export default WorldMap;
