import { NextResponse } from "next/server";
import { publicUrl } from "@/lib/request-url";

const API_BASE = (process.env.LEADFINDER_API_URL || "http://127.0.0.1:8021").replace(/\/$/, "");

export async function POST(req: Request, ctx: { params: Promise<{ watchlistId: string }> }) {
  const { watchlistId } = await ctx.params;
  try {
    await fetch(`${API_BASE}/watchlists/${watchlistId}/run`, {
      method: "POST",
      cache: "no-store",
    });
    return NextResponse.redirect(publicUrl(req, `/leadfinder/?watchlist_run=ok&watchlist_id=${encodeURIComponent(watchlistId)}`));
  } catch {
    return NextResponse.redirect(publicUrl(req, `/leadfinder/?watchlist_run=error&watchlist_id=${encodeURIComponent(watchlistId)}`));
  }
}
