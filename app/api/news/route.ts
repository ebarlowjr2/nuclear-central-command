import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 50);
    const source = searchParams.get("source");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("nuclear_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq("source_name", source);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching nuclear_news:", error);
      return NextResponse.json({ error: "Error fetching news" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Error in GET /api/news:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
