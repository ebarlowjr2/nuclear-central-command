import { NextResponse } from 'next/server';
import { NEWS_SYNC_REPORT } from '@/lib/news/reportData';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, report: NEWS_SYNC_REPORT });
}

