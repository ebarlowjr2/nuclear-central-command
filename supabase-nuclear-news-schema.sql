-- Nuclear News Aggregator Table
-- This table stores aggregated news from external RSS feeds
-- Separate from blog_posts to keep original content separate from curated news

CREATE TABLE IF NOT EXISTS public.nuclear_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,          -- e.g. 'World Nuclear News'
  source_feed_url TEXT NOT NULL,      -- RSS feed URL used
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  summary TEXT,                       -- RSS description / short text
  guid TEXT,                          -- unique ID from feed if present
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  category TEXT                       -- optional: 'Policy', 'SMR', 'Industry', etc.
);

-- Indexes for uniqueness and performance
CREATE UNIQUE INDEX IF NOT EXISTS nuclear_news_guid_idx ON public.nuclear_news (guid);
CREATE UNIQUE INDEX IF NOT EXISTS nuclear_news_link_idx ON public.nuclear_news (link);
CREATE INDEX IF NOT EXISTS nuclear_news_published_idx ON public.nuclear_news (published_at DESC);
