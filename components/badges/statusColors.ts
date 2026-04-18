export const STATUS_COLORS = {
  operating: { dot: '#18B6A4', border: 'rgba(24, 182, 164, 0.35)', bg: 'rgba(24, 182, 164, 0.10)' },
  suspended: { dot: '#F5B942', border: 'rgba(245, 185, 66, 0.35)', bg: 'rgba(245, 185, 66, 0.12)' },
  under_construction: { dot: '#1479FF', border: 'rgba(20, 121, 255, 0.35)', bg: 'rgba(20, 121, 255, 0.10)' },
  planned: { dot: '#7C3AED', border: 'rgba(124, 58, 237, 0.30)', bg: 'rgba(124, 58, 237, 0.10)' },
  shutdown: { dot: '#94A3B8', border: 'rgba(148, 163, 184, 0.45)', bg: 'rgba(148, 163, 184, 0.12)' },
} as const;

