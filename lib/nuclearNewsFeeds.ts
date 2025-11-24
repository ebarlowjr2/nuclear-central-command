export type NuclearFeed = {
  sourceName: string;
  feedUrl: string;
  siteUrl?: string;
};

export const NUCLEAR_FEEDS: NuclearFeed[] = [
  {
    sourceName: "World Nuclear News",
    feedUrl: "https://www.world-nuclear-news.org/rss",
    siteUrl: "https://www.world-nuclear-news.org",
  },
  {
    sourceName: "Nuclear Energy Institute",
    feedUrl: "https://www.nei.org/news.rss",
    siteUrl: "https://www.nei.org/news",
  },
  {
    sourceName: "ANS Nuclear Newswire",
    feedUrl: "https://www.ans.org/news/feed/",
    siteUrl: "https://www.ans.org/news",
  },
  {
    sourceName: "Morgan Lewis – Up & Atom",
    feedUrl: "https://www.morganlewis.com/blogs/upandatom/rss",
    siteUrl: "https://www.morganlewis.com/blogs/upandatom",
  },
];
