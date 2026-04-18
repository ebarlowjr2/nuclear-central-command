import fs from 'node:fs/promises';
import path from 'node:path';
import type { Company } from './types';
import { readLocalNews } from '@/lib/news/localStore';

const SEED_PATH = path.join(process.cwd(), 'data', 'companies.seed.json');

let cached: { at: number; companies: Company[] } | null = null;
const CACHE_TTL_MS = 60_000;

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function readSeedCompanies(): Promise<Company[]> {
  const raw = await fs.readFile(SEED_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Company[];
  return Array.isArray(parsed) ? parsed : [];
}

// Best-effort enrichment: scan latest local news for company name mentions and use that as "latestUpdate".
// This stays local-first and does not require scraping or third-party APIs.
export async function getCompaniesEnriched(): Promise<Company[]> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.companies;

  const [companies, news] = await Promise.all([readSeedCompanies(), readLocalNews()]);

  const enriched = companies.map((c) => {
    const needle = normalize(c.name);
    const hit = news.find((n) => normalize(`${n.title} ${n.summary}`).includes(needle));
    const tagHit = news.find((n) => (n.tags || []).includes(`company:${c.id}`));
    return { ...c, latestUpdate: tagHit?.publishedAt || hit?.publishedAt || c.latestUpdate || undefined };
  });

  // Default missing latestUpdate to "now" only if you explicitly want that behavior.
  cached = { at: now, companies: enriched };
  return enriched;
}
