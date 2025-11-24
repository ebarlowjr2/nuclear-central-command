import { getSupabaseAdmin } from "@/lib/supabaseServer";

type NewsItem = {
  id: string;
  source_name: string;
  title: string;
  link: string;
  summary?: string;
  published_at?: string;
  image_url?: string | null;
};

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

  if (!news.length) {
    return (
      <div className="mx-auto max-w-5xl py-16 px-4">
        <h1 className="text-3xl font-bold mb-4">In the News</h1>
        <p className="text-gray-400 text-sm">
          No nuclear news available yet. Check back soon.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = news;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
            Nuclear Central Command
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">
            In the News
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-300">
            Curated headlines from trusted nuclear energy sources – World
            Nuclear News, NEI, ANS, and more. Stay current on reactors, SMRs,
            policy, and innovation without leaving the command center.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-8">
            <a
              href={featured.link}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-xl shadow-black/40 hover:border-emerald-400/60 transition"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {featured.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.image_url}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-emerald-500/30 via-sky-500/20 to-slate-800 flex items-center justify-center">
                    <span className="text-xs md:text-sm font-medium uppercase tracking-[0.25em] text-emerald-100">
                      Featured Story
                    </span>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              </div>

              <div className="flex flex-col gap-2 p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                    {featured.source_name}
                  </span>
                  {featured.published_at && (
                    <span className="text-[11px] text-slate-400">
                      {new Date(featured.published_at).toLocaleString()}
                    </span>
                  )}
                </div>

                <h2 className="mt-1 text-xl md:text-2xl font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {featured.title}
                </h2>

                {featured.summary && (
                  <p className="mt-1 text-sm text-slate-300 line-clamp-3">
                    {featured.summary}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <span>Read article</span>
                  <span aria-hidden>↗</span>
                </div>
              </div>
            </a>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 hover:border-emerald-400/50 hover:bg-slate-900 transition"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center">
                        <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-medium text-slate-200">
                          {item.source_name}
                        </span>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p className="text-xs text-slate-300 line-clamp-3">
                        {item.summary}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400">
                        {item.source_name}
                      </span>
                      {item.published_at && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4">
              <h2 className="text-sm font-semibold text-white">
                Sources in this feed
              </h2>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                {Array.from(
                  new Map(
                    news.map((n) => [n.source_name, n.source_name])
                  ).values()
                ).map((source) => (
                  <li key={source} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{source}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 p-4">
              <h2 className="text-sm font-semibold text-white">
                Why this matters
              </h2>
              <p className="mt-2 text-xs text-emerald-50/90">
                Nuclear headlines in one place help demystify the tech, highlight
                safety advances, and show how reactors contribute to a
                carbon-reduced grid.
              </p>
              <p className="mt-2 text-[11px] text-emerald-100/80">
                Use this feed as a launchpad for blog posts, social content, or
                &quot;fun fact&quot; cards inside the command center.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
