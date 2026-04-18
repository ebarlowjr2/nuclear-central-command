export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string; // ISO string
  tags: string[];
};

export type NewsSource = {
  id: string;
  name: string;
  rssUrl: string;
};

