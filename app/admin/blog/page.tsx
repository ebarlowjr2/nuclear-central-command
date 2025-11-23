import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  created_at: string;
}

async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Error in getAllPosts:", err);
    return [];
  }
}

export default async function AdminBlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Link
          href="/admin/blog/new"
          className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90"
        >
          + New Post
        </Link>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="border rounded px-4 py-8 text-center text-muted-foreground">
            No blog posts yet. Create your first post to get started.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border rounded px-4 py-3 flex items-center justify-between bg-card"
            >
              <div>
                <p className="font-semibold">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  {post.status.toUpperCase()} •{" "}
                  {post.published_at
                    ? new Date(post.published_at).toLocaleString()
                    : new Date(post.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-xs text-primary underline"
                >
                  View
                </Link>
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="text-xs text-primary underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
