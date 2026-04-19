import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { NewsItem } from './types';

const DATA_PATH = path.join(process.cwd(), 'data', 'news.local.json');
const MAX_ITEMS = 1000;

export function canonicalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    // Drop common tracking params.
    const drop = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'utm_id',
      'utm_name',
      'utm_reader',
      'utm_viz_id',
      'utm_pubreferrer',
      'utm_swu',
      'gclid',
      'fbclid',
      'mc_cid',
      'mc_eid',
      'ref',
      'src',
    ]);
    for (const k of Array.from(u.searchParams.keys())) {
      if (drop.has(k) || k.startsWith('utm_')) u.searchParams.delete(k);
    }
    u.hash = '';
    // Normalize hostname casing and trailing slash.
    u.hostname = u.hostname.toLowerCase();
    const out = u.toString();
    return out.endsWith('/') ? out.slice(0, -1) : out;
  } catch {
    return input.trim();
  }
}

function stableId(source: string, url: string) {
  const canon = canonicalizeUrl(url);
  return crypto.createHash('sha256').update(`${source}::${canon}`).digest('hex').slice(0, 24);
}

function toIso(d: unknown): string {
  const dt = d instanceof Date ? d : d ? new Date(String(d)) : null;
  const t = dt && !Number.isNaN(dt.getTime()) ? dt : new Date();
  return t.toISOString();
}

export function buildNewsItem(input: {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt?: unknown;
  tags?: string[];
}): NewsItem {
  const url = canonicalizeUrl(input.url);
  return {
    id: stableId(input.source, url),
    title: input.title.trim(),
    summary: input.summary.trim(),
    url,
    source: input.source,
    publishedAt: toIso(input.publishedAt),
    tags: Array.from(new Set((input.tags || []).map((t) => t.trim()).filter(Boolean))).slice(0, 20),
  };
}

export async function readLocalNews(): Promise<NewsItem[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw) as NewsItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeLocalNews(items: NewsItem[]): Promise<void> {
  const sorted = items
    .slice()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_ITEMS);
  await fs.writeFile(DATA_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

export async function upsertLocalNews(newItems: NewsItem[]): Promise<{
  total: number;
  inserted: number;
  updated: number;
}> {
  const existing = await readLocalNews();
  const byId = new Map(existing.map((n) => [n.id, n]));

  let inserted = 0;
  let updated = 0;

  for (const item of newItems) {
    const prev = byId.get(item.id);
    if (!prev) {
      byId.set(item.id, item);
      inserted++;
      continue;
    }
    // Merge tags and keep the most recent publishedAt we know about.
    const tags = Array.from(new Set([...(prev.tags || []), ...(item.tags || [])])).slice(0, 20);
    const publishedAt = prev.publishedAt > item.publishedAt ? prev.publishedAt : item.publishedAt;
    byId.set(item.id, { ...prev, ...item, tags, publishedAt });
    updated++;
  }

  const merged = Array.from(byId.values());
  await writeLocalNews(merged);
  return { total: Math.min(merged.length, MAX_ITEMS), inserted, updated };
}
