import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import Parser from 'rss-parser';

// Offline news sync script:
// - fetches RSS feeds
// - dedupes + tags (lightweight)
// - writes data/news.json
//
// Usage:
//   node scripts/news/sync_news.mjs

const NEWS_SOURCES = [
  { name: 'World Nuclear News', rssUrl: 'https://world-nuclear-news.org/rss' },
  { name: 'Nuclear Engineering International', rssUrl: 'https://www.neimagazine.com/feed/' },
  { name: 'IAEA News', rssUrl: 'https://www.iaea.org/newscenter/news/rss.xml' },
  { name: 'American Nuclear Society', rssUrl: 'https://www.ans.org/news/rss/' },
  { name: 'World Nuclear Association', rssUrl: 'https://world-nuclear.org/rss.aspx' },
  { name: 'DOE Office of Nuclear Energy', rssUrl: 'https://www.energy.gov/ne/listings/nuclear-energy-news-releases/rss.xml' },
  { name: 'POWER Magazine', rssUrl: 'https://www.powermag.com/feed/' },
  { name: 'NRC News Releases', rssUrl: 'https://www.nrc.gov/public-involve/rss?feed=news' },
  { name: 'NRC Power Reactor Status', rssUrl: 'https://www.nrc.gov/public-involve/rss?feed=plant-status' },
  { name: 'Nuclear Innovation Alliance', rssUrl: 'https://www.nuclearinnovationalliance.org/rss.xml' },
  { name: 'Nuclear Energy Institute', rssUrl: 'https://www.nei.org/rss/news' },
];

const MAX_ITEMS = 1000;
const MAX_PER_SOURCE = 200;
const MAX_AGE_DAYS = 365 * 2; // keep at most ~2 years to avoid ancient feed backfills

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clampSummary(s) {
  const t = stripHtml(s);
  if (t.length <= 360) return t;
  return t.slice(0, 360).replace(/\s+\S*$/, '').trim() + '…';
}

function canonicalizeUrl(input) {
  try {
    const u = new URL(input);
    const drop = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'utm_id',
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
    u.hostname = u.hostname.toLowerCase();
    const out = u.toString();
    return out.endsWith('/') ? out.slice(0, -1) : out;
  } catch {
    return String(input || '').trim();
  }
}

function stableId(source, url) {
  return crypto.createHash('sha256').update(`${source}::${canonicalizeUrl(url)}`).digest('hex').slice(0, 24);
}

function toIso(d) {
  const dt = d instanceof Date ? d : d ? new Date(String(d)) : null;
  const t = dt && !Number.isNaN(dt.getTime()) ? dt : new Date();
  return t.toISOString();
}

function isRecentEnough(iso) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return true;
  const ageDays = (Date.now() - t) / 86400000;
  return ageDays <= MAX_AGE_DAYS;
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tagItem(item, reactors, companies) {
  const hay = normalize(`${item.title} ${item.summary}`);
  const tags = new Set(item.tags || []);

  // country tags from reactor dataset
  const countries = new Set(reactors.map((r) => r.country).filter(Boolean));
  for (const c of countries) {
    const ct = normalize(c).split(' ').filter((t) => t.length >= 4);
    if (ct.length && ct.every((t) => hay.includes(t))) tags.add(`country:${c}`);
  }

  // plant tags (conservative)
  let plantTags = 0;
  for (const r of reactors) {
    const pt = normalize(r.plant).split(' ').filter((t) => t.length >= 5).slice(0, 4);
    if (pt.length && pt.every((t) => hay.includes(t))) {
      tags.add(`plant:${r.plant}`);
      if (r.type) tags.add(`type:${r.type}`);
      plantTags++;
      if (plantTags >= 3) break;
    }
  }

  // company tags from seed list (match 2+ meaningful tokens)
  for (const c of companies) {
    const toks = normalize(c.name).split(' ').filter((t) => t.length >= 4);
    if (!toks.length) continue;
    const hits = toks.filter((t) => hay.includes(t)).length;
    if (hits >= Math.min(2, toks.length)) tags.add(`company:${c.id}`);
  }

  const out = Array.from(tags).slice(0, 20);
  return { ...item, tags: out };
}

async function readJson(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return [];
  }
}

async function main() {
  const newsPath = path.join(process.cwd(), 'data', 'news.json');
  const reportPath = path.join(process.cwd(), 'data', 'news.sync-report.json');
  const reactorsPath = path.join(process.cwd(), 'data', 'reactors.json');
  const companiesPath = path.join(process.cwd(), 'data', 'companies.seed.json');

  const [existing, reactors, companies] = await Promise.all([
    readJson(newsPath),
    readJson(reactorsPath),
    readJson(companiesPath),
  ]);

  const byId = new Map(Array.isArray(existing) ? existing.map((n) => [n.id, n]) : []);
  const parser = new Parser({
    timeout: 20_000,
    headers: { 'User-Agent': 'NuclearCommandCenterBot/1.0 (+offline sync)' },
  });

  let inserted = 0;
  let updated = 0;
  const perSource = [];

  for (const src of NEWS_SOURCES) {
    try {
      const feed = await parser.parseURL(src.rssUrl);
      const items = (feed.items || []).slice(0, MAX_PER_SOURCE);
      let kept = 0;
      let skippedOld = 0;
      let skippedNoUrl = 0;
      let skippedNoTitle = 0;
      for (const it of items) {
        const url = String(it.link || '').trim();
        const title = String(it.title || '').trim();
        if (!url) {
          skippedNoUrl++;
          continue;
        }
        if (!title) {
          skippedNoTitle++;
          continue;
        }

        const summary =
          clampSummary(it.contentSnippet || '') ||
          clampSummary(it.content || '') ||
          clampSummary(it.summary || '') ||
          '';

        const canonUrl = canonicalizeUrl(url);
        const id = stableId(src.name, canonUrl);
        const publishedAt = toIso(it.isoDate || it.pubDate);
        if (!isRecentEnough(publishedAt)) {
          skippedOld++;
          continue;
        }

        const next = tagItem(
          {
            id,
            title,
            summary,
            url: canonUrl,
            source: src.name,
            publishedAt,
            tags: [],
          },
          Array.isArray(reactors) ? reactors : [],
          Array.isArray(companies) ? companies : []
        );

        const prev = byId.get(id);
        if (!prev) {
          byId.set(id, next);
          inserted++;
        } else {
          byId.set(id, { ...prev, ...next });
          updated++;
        }
        kept++;
      }
      perSource.push({
        source: src.name,
        ok: true,
        fetched: items.length,
        kept,
        skippedOld,
        skippedNoUrl,
        skippedNoTitle,
      });
    } catch (e) {
      console.error(`[${src.name}] failed:`, e?.message || e);
      perSource.push({ source: src.name, ok: false, error: e?.message || String(e) });
    }
  }

  const merged = Array.from(byId.values())
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, MAX_ITEMS);

  await fs.writeFile(newsPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  const report = {
    ok: true,
    ranAt: new Date().toISOString(),
    total: merged.length,
    inserted,
    updated,
    sources: perSource,
  };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`news.json updated: total=${merged.length} inserted=${inserted} updated=${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
