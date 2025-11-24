import { NextResponse } from "next/server";
import { refreshNuclearNews } from "@/lib/refreshNuclearNews";

// TODO: protect this with auth when admin auth is ready
export async function POST() {
  try {
    await refreshNuclearNews();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Error refreshing nuclear news:", err);
    const errorMessage = err instanceof Error ? err.message : "Error refreshing news";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
