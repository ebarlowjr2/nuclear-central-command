import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching blog posts:", error);
      return NextResponse.json({ error: "Error fetching posts" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Error in GET /api/blog:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, excerpt, content, status = "draft", tags = [] } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, content" },
        { status: 400 }
      );
    }

    const published_at =
      status === "published" ? new Date().toISOString() : null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .insert([{ title, slug, excerpt, content, status, tags, published_at }])
      .select()
      .single();

    if (error) {
      console.error("Error creating blog post:", error);
      return NextResponse.json(
        { error: error.message || "Error creating blog post" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error("Error in POST /api/blog:", err);
    const errorMessage = err instanceof Error ? err.message : "Error creating blog post";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
