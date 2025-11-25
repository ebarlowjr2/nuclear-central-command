import Parser from "rss-parser";
import { getSupabaseAdmin } from "./supabaseServer";
import { NUCLEAR_FEEDS } from "./nuclearNewsFeeds";

interface CustomItem {
  guid?: string;
  id?: string;
  link?: string;
  title?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  enclosure?: { url?: string };
  "wnn:articleImage"?: string;
  "wnn:fullText"?: string;
  "media:content"?: Array<{ $?: { url?: string } }>;
  "media:thumbnail"?: Array<{ $?: { url?: string } }>;
  "content:encoded"?: string;
  description?: string;
}

const parser = new Parser<Record<string, never>, CustomItem>({
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

        if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        }

        const mediaContent = item["media:content"];
        if (!imageUrl && Array.isArray(mediaContent) && mediaContent[0]?.$?.url) {
          imageUrl = mediaContent[0].$.url;
        }

        const mediaThumb = item["media:thumbnail"];
        if (!imageUrl && Array.isArray(mediaThumb) && mediaThumb[0]?.$?.url) {
          imageUrl = mediaThumb[0].$.url;
        }

        if (!imageUrl && item["wnn:articleImage"]) {
          imageUrl = item["wnn:articleImage"];
        }

        if (!imageUrl) {
          const html =
            item["content:encoded"] ??
            item.content ??
            item.description ??
            item.summary;

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
