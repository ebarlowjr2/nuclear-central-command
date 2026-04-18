import type { Reactor } from '@/lib/reactors/types';
import type { NewsItem } from './types';

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(s: string) {
  return normalize(s).split(' ').filter(Boolean);
}

function hasAllTokens(hay: string, tokens: string[]) {
  return tokens.every((t) => hay.includes(t));
}

export function tagNewsItem(item: NewsItem, reactors: Reactor[]): NewsItem {
  const hay = normalize(`${item.title} ${item.summary}`);
  const tags = new Set(item.tags || []);

  // Simple source tags for filtering.
  tags.add(item.source);

  // Reactor-based tags: match plant names and common unit strings.
  // Keep it conservative to avoid noisy tags.
  for (const r of reactors) {
    const plantTokens = tokenize(r.plant).filter((t) => t.length >= 5).slice(0, 3);
    if (plantTokens.length > 0 && hasAllTokens(hay, plantTokens)) {
      tags.add(`plant:${r.plant}`);
      tags.add(`country:${r.country}`);
      if (r.type) tags.add(`type:${r.type}`);
      break;
    }
  }

  // Country tags (best-effort).
  // Keep it to known reactor countries to avoid tagging every mention of "us".
  const countrySet = new Set(reactors.map((r) => r.country));
  for (const c of countrySet) {
    const ct = tokenize(c).filter((t) => t.length >= 4);
    if (ct.length > 0 && hasAllTokens(hay, ct)) tags.add(`country:${c}`);
  }

  return { ...item, tags: Array.from(tags).slice(0, 20) };
}

