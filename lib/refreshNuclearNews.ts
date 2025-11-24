import Parser from "rss-parser";
import { getSupabaseAdmin } from "./supabaseServer";
import { NUCLEAR_FEEDS } from "./nuclearNewsFeeds";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: ["wnn:articleImage", "wnn:fullText", "media:content", "media:thumbnail", "content:encoded"],
  },
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

        let imageUrl: string | null = null;

        const itemWithEnclosure = item as { enclosure?: { url?: string } };
        if (itemWithEnclosure.enclosure?.url) {
          imageUrl = itemWithEnclosure.enclosure.url;
        }

        const itemWithMedia = item as { "media:content"?: Array<{ $?: { url?: string } }> };
        const mediaContent = itemWithMedia["media:content"];
        if (!imageUrl && Array.isArray(mediaContent) && mediaContent[0]?.$?.url) {
          imageUrl = mediaContent[0].$.url;
        }

        const itemWithThumb = item as { "media:thumbnail"?: Array<{ $?: { url?: string } }> };
        const mediaThumb = itemWithThumb["media:thumbnail"];
        if (!imageUrl && Array.isArray(mediaThumb) && mediaThumb[0]?.$?.url) {
          imageUrl = mediaThumb[0].$.url;
        }

        const itemWithWnnImage = item as { "wnn:articleImage"?: string };
        if (!imageUrl && itemWithWnnImage["wnn:articleImage"]) {
          imageUrl = itemWithWnnImage["wnn:articleImage"];
        }

        if (!imageUrl) {
          const itemWithContent = item as {
            "content:encoded"?: string;
            content?: string;
            description?: string;
            summary?: string;
          };
          const html =
            itemWithContent["content:encoded"] ??
            itemWithContent.content ??
            itemWithContent.description ??
            itemWithContent.summary;

          if (typeof html === "string") {
            const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (match?.[1]) {
              const src = match[1];
              if (src.startsWith("http")) {
                imageUrl = src;
              } else if (feed.siteUrl) {
                try {
                  imageUrl = new URL(src, feed.siteUrl).toString();
                } catch (e) {
                  console.error("Error parsing relative image URL:", e);
                }
              }
            }
          }
        }

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
              image_url: imageUrl,
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
