"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  id: string;
  source_name: string;
  title: string;
  link: string;
  summary?: string;
  published_at?: string;
};

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news?limit=100");
      if (!res.ok) throw new Error("Failed to load news");
      const data = await res.json();
      setNews(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error loading news";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/news/refresh", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refresh news");
      }
      await loadNews();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error refreshing news";
      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Nuclear News Aggregator</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh Feeds"}
        </button>
      </div>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading news…</p>}

      <div className="space-y-3 mt-4">
        {news.map((item) => (
          <div
            key={item.id}
            className="border rounded px-4 py-3 bg-card flex flex-col gap-1"
          >
            <div className="flex justify-between gap-4">
              <h2 className="font-semibold text-sm">{item.title}</h2>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.source_name}
              </span>
            </div>
            {item.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.summary}
              </p>
            )}
            <div className="flex justify-between items-center mt-1">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline"
              >
                View original
              </a>
              <span className="text-[10px] text-muted-foreground">
                {item.published_at &&
                  new Date(item.published_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
