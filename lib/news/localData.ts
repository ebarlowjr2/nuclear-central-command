import type { NewsItem } from './types';

// Static import so Vercel bundles the file (no runtime fs writes/reads required).
import news from '@/data/news.json';

export const LOCAL_NEWS: NewsItem[] = news as NewsItem[];

