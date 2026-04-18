import type { NewsSource } from './types';

// Prefer RSS. If a source does not provide RSS reliably, we will add it later with
// a lightweight HTML metadata fetch (title/description/url) and never full article scraping.
export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'world-nuclear-news',
    name: 'World Nuclear News',
    rssUrl: 'https://world-nuclear-news.org/rss',
  },
  {
    id: 'iaea-news',
    name: 'IAEA News',
    rssUrl: 'https://www.iaea.org/newscenter/news/rss.xml',
  },
  {
    id: 'ans-news',
    name: 'American Nuclear Society',
    rssUrl: 'https://www.ans.org/news/rss/',
  },
  {
    id: 'wna-news',
    name: 'World Nuclear Association',
    rssUrl: 'https://world-nuclear.org/rss.aspx',
  },
  {
    id: 'doe-ne',
    name: 'DOE Office of Nuclear Energy',
    rssUrl: 'https://www.energy.gov/ne/listings/nuclear-energy-news-releases/rss.xml',
  },
  {
    id: 'power-mag',
    name: 'POWER Magazine',
    rssUrl: 'https://www.powermag.com/feed/',
  },
  {
    id: 'nuclear-innovation-alliance',
    name: 'Nuclear Innovation Alliance',
    rssUrl: 'https://www.nuclearinnovationalliance.org/rss.xml',
  },
  {
    id: 'nei',
    name: 'Nuclear Energy Institute',
    rssUrl: 'https://www.nei.org/rss/news',
  },
];

