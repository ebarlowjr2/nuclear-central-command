import ReactMarkdown from "react-markdown";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  published_at: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("status", "published");

    return (data || []).map((p) => ({ slug: p.slug }));
  } catch (err) {
    console.error("Error generating static params:", err);
    return [];
  }
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error in getPost:", err);
    return null;
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-3">{post.title}</h1>
      <p className="text-xs text-muted-foreground mb-4 md:mb-6">
        {post.published_at && new Date(post.published_at).toDateString()}
      </p>
      <article className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-li:text-foreground">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>
    </div>
  );
}
