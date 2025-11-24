import Parser from "rss-parser";
import { getSupabaseAdmin } from "./supabaseServer";
import { NUCLEAR_FEEDS } from "./nuclearNewsFeeds";

const parser = new Parser({
  timeout: 15000,
});

export async function refreshNuclearNews() {
  const supabase = getSupabaseAdmin();
  
  for (const feed of NUCLEAR_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.feedUrl);

      const items = parsed.items || [];

      for (const item of items) {
        const guid = (item.guid || item.id || item.link) ?? null;
        const link = item.link || "";
        if (!link) continue;

        const publishedAt =
          item.isoDate || item.pubDate
            ? new Date(item.isoDate || (item.pubDate as string))
            : null;

        // Upsert by guid or link to avoid duplicates
        const { error } = await supabase
          .from("nuclear_news")
          .upsert(
            {
              source_name: feed.sourceName,
              source_feed_url: feed.feedUrl,
              title: item.title ?? "Untitled",
              link,
              summary: item.contentSnippet || item.content || item.summary || null,
              guid,
              published_at: publishedAt ? publishedAt.toISOString() : null,
            },
            {
              onConflict: guid ? "guid" : "link",
            }
          );

        if (error) {
          console.error("Error upserting nuclear_news item:", error);
        }
      }
    } catch (err) {
      console.error(`Error refreshing feed ${feed.sourceName}`, err);
    }
  }
}
