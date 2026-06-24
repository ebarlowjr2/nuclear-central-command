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

type Size = {
  width: number;
  height: number;
  dpr: number;
};

type Point3D = {
  x: number;
  y: number;
  z: number;
};

type ScreenPoint = {
  x: number;
  y: number;
  z: number;
};

const GRID_COLOR = 'rgba(125, 211, 252, 0.16)';
const GRID_COLOR_MINOR = 'rgba(148, 163, 184, 0.10)';
const POINT_COLOR = '#fbbf24';

const DEFAULT_MARKERS: GlobeMarker[] = [];

const STAR_COUNT = 160;

function WorldMap({ compact = false, markers = DEFAULT_MARKERS }: WorldMapProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const sizeRef = React.useRef<Size>({ width: 0, height: 0, dpr: 1 });
  const rotationRef = React.useRef({ yaw: 0.2, pitch: -0.15 });
  const dragRef = React.useRef({ dragging: false, x: 0, y: 0 });
  const stars = React.useMemo(() => createStars(STAR_COUNT), []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(320, rect.width);
      const height = Math.max(compact ? 480 : 720, rect.height);

      sizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    let raf = 0;

    const render = () => {
      const { width, height } = sizeRef.current;
      const ctx = context;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * (compact ? 0.28 : 0.33);
      const yaw = rotationRef.current.yaw;
      const pitch = rotationRef.current.pitch;

      ctx.clearRect(0, 0, width, height);

      drawBackground(ctx, width, height, stars, frame);
      drawHalo(ctx, cx, cy, radius);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      drawOcean(ctx, cx, cy, radius);
      drawAtmosphere(ctx, cx, cy, radius);
      drawGraticule(ctx, cx, cy, radius, yaw, pitch);
      drawMarkers(ctx, markers, cx, cy, radius, yaw, pitch);

      ctx.restore();

      drawRim(ctx, cx, cy, radius);
      drawCaption(ctx, width, height, markers.length);

      frame += 1;
      if (!dragRef.current.dragging) {
        rotationRef.current.yaw += 0.0012;
      }
      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);

    const onPointerDown = (event: PointerEvent) => {
      dragRef.current.dragging = true;
      dragRef.current.x = event.clientX;
      dragRef.current.y = event.clientY;
      container.setPointerCapture(event.pointerId);
      container.style.cursor = 'grabbing';
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
      container.style.cursor = 'grab';
      try {
        container.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be gone on some browsers.
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
    };
  }, [compact, markers, stars]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: compact ? 480 : 720,
        borderRadius: 28,
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        boxShadow: '0 30px 90px rgba(2, 6, 23, 0.45)',
        background: 'linear-gradient(180deg, #07111f 0%, #02060d 100%)',
        cursor: 'grab',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

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
          Globe view first, reactor locations next.
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
          This is the globe surface we can build on. We’ll add reactor sites once the view is stable.
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
        Drag to rotate the globe
      </div>
    </div>
  );
}

function createStars(count: number) {
  const stars: Array<{ x: number; y: number; radius: number; alpha: number }> = [];
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

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stars: Array<{ x: number; y: number; radius: number; alpha: number }>,
  frame: number,
) {
  const cx = width / 2;
  const cy = height / 2;

  const background = ctx.createRadialGradient(cx * 0.95, cy * 0.88, 20, cx, cy, Math.max(width, height));
  background.addColorStop(0, '#16365a');
  background.addColorStop(0.45, '#081220');
  background.addColorStop(1, '#02050b');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = '#fff';
  for (const [index, star] of stars.entries()) {
    const x = (star.x * width + Math.sin((frame + index) * 0.003) * 4) % width;
    const y = (star.y * height + Math.cos((frame + index) * 0.004) * 3) % height;
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(x < 0 ? x + width : x, y < 0 ? y + height : y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHalo(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const halo = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 1.7);
  halo.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
  halo.addColorStop(0.45, 'rgba(59, 130, 246, 0.10)');
  halo.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - radius * 1.75, y - radius * 1.75, radius * 3.5, radius * 3.5);
}

function drawOcean(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const ocean = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.32, radius * 0.1, x, y, radius);
  ocean.addColorStop(0, '#12314f');
  ocean.addColorStop(0.55, '#0b1b2f');
  ocean.addColorStop(1, '#06111f');
  ctx.fillStyle = ocean;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const sheen = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.42, radius * 0.08, x, y, radius);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  sheen.addColorStop(0.28, 'rgba(255, 255, 255, 0.05)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawRim(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawCaption(ctx: CanvasRenderingContext2D, width: number, height: number, markerCount: number) {
  ctx.save();
  const boxWidth = Math.min(360, width - 32);
  const boxHeight = 58;
  const x = width / 2 - boxWidth / 2;
  const y = height - boxHeight - 20;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, boxWidth, boxHeight, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.fillText(`${markerCount} reactor sites ready to add`, x + 16, y + 24);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillText('We can map reactor locations onto this globe next.', x + 16, y + 43);
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
    strokeProjectedSegments(ctx, sampleCircle(lat, yaw, pitch, 72), centerX, centerY, radius, GRID_COLOR_MINOR);
  }

  for (let lng = -180; lng < 180; lng += 30) {
    strokeProjectedSegments(ctx, sampleMeridian(lng, yaw, pitch, 72), centerX, centerY, radius, GRID_COLOR);
  }

  ctx.restore();
}

function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: GlobeMarker[],
  centerX: number,
  centerY: number,
  radius: number,
  yaw: number,
  pitch: number,
) {
  if (!markers.length) return;

  const projected = markers
    .map((marker) => ({ marker, point: rotatePoint(marker.lat, marker.lng, yaw, pitch) }))
    .filter(({ point }) => point.z > 0)
    .sort((a, b) => a.point.z - b.point.z);

  for (const { marker, point } of projected) {
    const x = centerX + point.x * radius;
    const y = centerY - point.y * radius;
    const markerRadius = 2.5 + Math.max(0, Math.min(6, Math.log10((marker.label?.length || 8) + 10)));
    const color = marker.color || POINT_COLOR;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function strokeProjectedSegments(
  ctx: CanvasRenderingContext2D,
  points: ScreenPoint[],
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    const alpha = clamp(((a.z + b.z) / 2) * 0.75 + 0.08, 0.04, 0.5);

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

function sampleCircle(lat: number, yaw: number, pitch: number, steps: number) {
  const points: ScreenPoint[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const lng = -180 + (360 * step) / steps;
    points.push(rotatePoint(lat, lng, yaw, pitch));
  }
  return points;
}

function sampleMeridian(lng: number, yaw: number, pitch: number, steps: number) {
  const points: ScreenPoint[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const lat = -90 + (180 * step) / steps;
    points.push(rotatePoint(lat, lng, yaw, pitch));
  }
  return points;
}

function rotatePoint(lat: number, lng: number, yaw: number, pitch: number): ScreenPoint {
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

  return { x, y, z: (z + 1) / 2 };
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
