import { NextResponse } from "next/server";

const API_BASE = (process.env.LEADFINDER_API_URL || "http://127.0.0.1:8021").replace(/\/$/, "");

export async function GET(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await ctx.params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";

  const upstream = await fetch(`${API_BASE}/leads/${companyId}/executive/export?format=${encodeURIComponent(format)}`, {
    method: "GET",
    cache: "no-store",
  });

  const body = await upstream.arrayBuffer();
  const headers = new Headers();
  headers.set("content-type", upstream.headers.get("content-type") || (format === "csv" ? "text/csv" : "application/json"));
  const disposition = upstream.headers.get("content-disposition") || `attachment; filename=lead-${companyId}.${format === "csv" ? "csv" : "json"}`;
  headers.set("content-disposition", disposition);

  return new NextResponse(body, {
    status: upstream.status,
    headers,
  });
}
