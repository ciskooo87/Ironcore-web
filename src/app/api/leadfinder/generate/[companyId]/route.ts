import { NextResponse } from "next/server";
import { publicUrl } from "@/lib/request-url";

const API_BASE = (process.env.LEADFINDER_API_URL || "http://127.0.0.1:8021").replace(/\/$/, "");

export async function POST(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await ctx.params;
  try {
    const upstream = await fetch(`${API_BASE}/leads/generate/${companyId}`, {
      method: "POST",
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.redirect(
        publicUrl(req, `/leadfinder/?company_id=${encodeURIComponent(companyId)}&generated=error&reason=${encodeURIComponent(text.slice(0, 120))}`),
      );
    }

    return NextResponse.redirect(publicUrl(req, `/leadfinder/?company_id=${encodeURIComponent(companyId)}&generated=ok`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.redirect(
      publicUrl(req, `/leadfinder/?company_id=${encodeURIComponent(companyId)}&generated=error&reason=${encodeURIComponent(message)}`),
    );
  }
}
