import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching blog posts:", error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("Error fetching posts:", err);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Nuclear Insights & Fun Facts</h1>
      <p className="text-sm text-muted-foreground mb-4 md:mb-6">
        Original posts from the Nuclear Command Center on reactors, SMRs,
        policy, and nuclear tech.
      </p>

      <div className="space-y-3 md:space-y-4">
        {posts.length === 0 ? (
          <div className="border rounded p-8 text-center text-muted-foreground">
            No blog posts published yet. Check back soon for nuclear insights and updates.
          </div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block border rounded p-4 hover:bg-accent bg-card transition-colors"
            >
              <h2 className="text-xl font-semibold">{post.title}</h2>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground mt-1">{post.excerpt}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {post.published_at &&
                  new Date(post.published_at).toDateString()}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
