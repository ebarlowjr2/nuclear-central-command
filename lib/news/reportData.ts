import report from '@/data/news.sync-report.json';

export const NEWS_SYNC_REPORT = report as {
  ok: boolean;
  ranAt: string | null;
  total: number;
  inserted: number;
  updated: number;
  sources: Array<{ source: string; ok: boolean; fetched?: number; kept?: number; error?: string }>;
};

