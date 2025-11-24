import { getSupabaseAdmin } from "@/lib/supabaseServer";

interface NewsItem {
  id: string;
  source_name: string;
  title: string;
  link: string;
  summary?: string;
  published_at?: string;
}

async function fetchNews(): Promise<NewsItem[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("nuclear_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching nuclear_news:", error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("Error fetching news:", err);
    return [];
  }
}

export default async function InTheNewsPage() {
  const news = await fetchNews();

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">In the News</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Live headlines from trusted nuclear energy sources — World Nuclear News,
        NEI, ANS, and others. Click through to read the full articles on the
        original sites.
      </p>

      <div className="space-y-4">
        {news.length === 0 ? (
          <div className="border rounded p-8 text-center text-muted-foreground">
            No news items available yet. Check back soon for the latest nuclear energy headlines.
          </div>
        ) : (
          news.map((item) => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="block border rounded p-4 bg-card hover:bg-accent transition-colors"
            >
              <div className="flex justify-between gap-4 mb-1">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.source_name}
                </span>
              </div>
              {item.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.summary}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">
                {item.published_at &&
                  new Date(item.published_at).toLocaleString()}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
