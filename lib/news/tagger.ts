import type { Reactor } from '@/lib/reactors/types';
import type { Company } from '@/lib/companies/types';
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

function clampTags(tags: Set<string>) {
  // Keep tags compact and predictable.
  // Priority: company/plant/country/type/source
  const priority = (t: string) => {
    if (t.startsWith('company:')) return 1;
    if (t.startsWith('plant:')) return 2;
    if (t.startsWith('country:')) return 3;
    if (t.startsWith('type:')) return 4;
    return 10;
  };
  return Array.from(tags)
    .filter(Boolean)
    .slice(0, 200)
    .sort((a, b) => priority(a) - priority(b) || a.localeCompare(b))
    .slice(0, 20);
}

function buildCompanyMatchers(companies: Company[]) {
  // Conservative: match full name tokens (>=4 chars) plus a few hand-picked short forms.
  const short: Record<string, string[]> = {
    edf: ['edf'],
    'ge-hitachi': ['ge hitachi', 'geh', 'bwrx'],
    nei: ['nei'],
    ans: ['ans'],
    tva: ['tva'],
    exelon: ['exelon'],
    rosatom: ['rosatom'],
  };

  return companies.map((c) => {
    const nameTokens = tokenize(c.name).filter((t) => t.length >= 4);
    const extra = (short[c.id] || []).flatMap((s) => tokenize(s));
    return { id: c.id, name: c.name, tokens: Array.from(new Set([...nameTokens, ...extra])) };
  });
}

export function tagNewsItem(item: NewsItem, reactors: Reactor[], companies: Company[] = []): NewsItem {
  const hay = normalize(`${item.title} ${item.summary}`);
  const tags = new Set(item.tags || []);

  // Simple source tags for filtering.
  tags.add(item.source);

  // Reactor-based tags: match plant names and common unit strings.
  // Keep it conservative to avoid noisy tags.
  for (const r of reactors) {
    const plantTokens = tokenize(r.plant).filter((t) => t.length >= 5).slice(0, 4);
    if (plantTokens.length > 0 && hasAllTokens(hay, plantTokens)) {
      tags.add(`plant:${r.plant}`);
      tags.add(`country:${r.country}`);
      if (r.type) tags.add(`type:${r.type}`);
      // Keep going; an article may mention multiple plants.
    }
  }

  // Country tags (best-effort).
  // Keep it to known reactor countries to avoid tagging every mention of "us".
  const countrySet = new Set(reactors.map((r) => r.country));
  for (const c of countrySet) {
    const ct = tokenize(c).filter((t) => t.length >= 4);
    if (ct.length > 0 && hasAllTokens(hay, ct)) tags.add(`country:${c}`);
  }

  // Company tags (seeded list; conservative token matching).
  if (companies.length > 0) {
    const matchers = buildCompanyMatchers(companies);
    for (const m of matchers) {
      if (m.tokens.length === 0) continue;
      // Require at least 2 tokens unless it's a known short-form keyword.
      const minTokens = m.tokens.length >= 3 ? 2 : 1;
      const hits = m.tokens.filter((t) => hay.includes(t));
      if (hits.length >= minTokens) tags.add(`company:${m.id}`);
    }
  }

  return { ...item, tags: clampTags(tags) };
}
