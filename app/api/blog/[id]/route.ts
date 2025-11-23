import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching blog post:", error);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Error in GET /api/blog/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, slug, excerpt, content, status, tags } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at when changing to published status
      if (status === "published") {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (tags !== undefined) updateData.tags = tags;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating blog post:", error);
      return NextResponse.json(
        { error: error.message || "Error updating blog post" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Error in PATCH /api/blog/[id]:", err);
    const errorMessage = err instanceof Error ? err.message : "Error updating blog post";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting blog post:", error);
      return NextResponse.json(
        { error: error.message || "Error deleting blog post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error in DELETE /api/blog/[id]:", err);
    const errorMessage = err instanceof Error ? err.message : "Error deleting blog post";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
