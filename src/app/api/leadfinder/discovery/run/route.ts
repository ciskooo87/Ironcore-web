import { NextResponse } from "next/server";
import { publicUrl } from "@/lib/request-url";

const API_BASE = (process.env.LEADFINDER_API_URL || "http://127.0.0.1:8021").replace(/\/$/, "");

function maybeProvider(kind: string, form: FormData, prefix: string) {
  const enabled = String(form.get(`${prefix}_enabled`) || "") === "on";
  if (!enabled) return null;

  const url = String(form.get(`${prefix}_url`) || "").trim();
  if (!url) return null;

  const sourceName = String(form.get(`${prefix}_source_name`) || "").trim();
  const confidence = Number(form.get(`${prefix}_confidence`) || 0.82);

  const payload: Record<string, unknown> = {
    url,
    source_name: sourceName,
    confidence,
    normalize_after_insert: true,
  };

  if (kind === "generic_html_news" || kind === "generic_html_legal" || kind === "generic_html_jobs") {
    payload.item_selector = String(form.get(`${prefix}_item_selector`) || "article");
    payload.title_selector = String(form.get(`${prefix}_title_selector`) || "h1, h2, h3");
    payload.content_selector = String(form.get(`${prefix}_content_selector`) || "p");
    payload.company_selector = String(form.get(`${prefix}_company_selector`) || ".company");
    payload.city_selector = String(form.get(`${prefix}_city_selector`) || ".city");
    payload.state_selector = String(form.get(`${prefix}_state_selector`) || ".state");
    payload.link_selector = String(form.get(`${prefix}_link_selector`) || "a[href]");
    payload.website_selector = String(form.get(`${prefix}_website_selector`) || ".company-site");
  }

  return { kind, payload };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const providers = [
      maybeProvider("generic_html_news", form, "news"),
      maybeProvider("generic_html_legal", form, "legal"),
      maybeProvider("generic_html_reputation", form, "reputation"),
      maybeProvider("formal_acts", form, "formal"),
      maybeProvider("serasa", form, "serasa"),
      maybeProvider("generic_html_jobs", form, "jobs"),
    ].filter(Boolean);

    if (!providers.length) {
      return NextResponse.redirect(publicUrl(req, "/leadfinder/?discovery=error&reason=nenhum+provider+selecionado"));
    }

    const upstream = await fetch(`${API_BASE}/discovery/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        providers,
        generate_leads: true,
        ranking_limit: 20,
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.redirect(publicUrl(req, `/leadfinder/?discovery=error&reason=${encodeURIComponent(text.slice(0, 140))}`));
    }

    const body = await upstream.json();
    const impacted = Array.isArray(body?.impacted_company_ids) ? body.impacted_company_ids.length : 0;
    const leads = Number(body?.generated_leads || 0);
    return NextResponse.redirect(publicUrl(req, `/leadfinder/?discovery=ok&impacted=${impacted}&leads=${leads}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.redirect(publicUrl(req, `/leadfinder/?discovery=error&reason=${encodeURIComponent(message)}`));
  }
}
