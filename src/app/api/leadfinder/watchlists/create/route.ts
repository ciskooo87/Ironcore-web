import { NextResponse } from "next/server";
import { publicUrl } from "@/lib/request-url";

const API_BASE = (process.env.LEADFINDER_API_URL || "http://127.0.0.1:8021").replace(/\/$/, "");

function configFromForm(form: FormData) {
  const sourceKind = String(form.get("source_kind") || "");
  const url = String(form.get("url") || "").trim();
  const sourceName = String(form.get("source_name") || "").trim();
  const confidence = Number(form.get("confidence") || 0.82);

  if (sourceKind === "generic_html_jobs") {
    return {
      url,
      source_name: sourceName,
      listing_selector: String(form.get("listing_selector") || "article"),
      title_selector: String(form.get("title_selector") || "h2, h3"),
      content_selector: String(form.get("content_selector") || "p"),
      company_selector: String(form.get("company_selector") || ".company"),
      city_selector: String(form.get("city_selector") || ".city"),
      state_selector: String(form.get("state_selector") || ".state"),
      link_selector: String(form.get("link_selector") || "a[href]"),
      website_selector: String(form.get("website_selector") || ".company-site"),
      confidence,
      normalize_after_insert: true,
    };
  }

  if (sourceKind === "generic_html_news") {
    return {
      url,
      source_name: sourceName,
      confidence,
      normalize_after_insert: true,
    };
  }

  if (sourceKind === "generic_html_legal") {
    return {
      url,
      source_name: sourceName,
      confidence,
      normalize_after_insert: true,
    };
  }

  if (sourceKind === "json_jobs") {
    return {
      url,
      source_name: sourceName,
      items_path: String(form.get("items_path") || "items"),
      title_path: String(form.get("title_path") || "title"),
      content_path: String(form.get("content_path") || "description"),
      company_path: String(form.get("company_path") || "company"),
      city_path: String(form.get("city_path") || "city"),
      state_path: String(form.get("state_path") || "state"),
      link_path: String(form.get("link_path") || "url"),
      website_path: String(form.get("website_path") || "website"),
      external_id_path: String(form.get("external_id_path") || "id"),
      confidence,
      normalize_after_insert: true,
    };
  }

  if (sourceKind === "jsonld_jobs") {
    return {
      url,
      source_name: sourceName,
      confidence,
      normalize_after_insert: true,
    };
  }

  throw new Error(`source_kind não suportado: ${sourceKind}`);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const payload = {
      name: String(form.get("name") || "").trim(),
      source_kind: String(form.get("source_kind") || "").trim(),
      source_name: String(form.get("source_name") || "").trim(),
      schedule_minutes: form.get("schedule_minutes") ? Number(form.get("schedule_minutes")) : null,
      active: String(form.get("active") || "true") !== "false",
      config_json: JSON.stringify(configFromForm(form)),
    };

    const upstream = await fetch(`${API_BASE}/watchlists`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.redirect(publicUrl(req, `/leadfinder/?watchlist_create=error&reason=${encodeURIComponent(text.slice(0, 120))}`));
    }

    return NextResponse.redirect(publicUrl(req, `/leadfinder/?watchlist_create=ok`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.redirect(publicUrl(req, `/leadfinder/?watchlist_create=error&reason=${encodeURIComponent(message)}`));
  }
}
