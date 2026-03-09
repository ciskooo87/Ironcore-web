import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deepseekChat } from "@/lib/deepseek";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login/?error=forbidden", req.url));
  }

  let body: { context?: string; question?: string };
  try {
    body = (await req.json()) as { context?: string; question?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const context = String(body.context || "").trim();
  const question = String(body.question || "").trim();

  if (!question) {
    return NextResponse.json({ error: "question_required" }, { status: 400 });
  }

  const system = [
    "Você é o motor de diagnóstico operacional do Ironcore.",
    "Responda em JSON com: diagnosis, risks, recommendations.",
    "Se faltar contexto, diga explicitamente as lacunas.",
    "Seja objetivo e acionável.",
  ].join(" ");

  const userPrompt = [
    `Pergunta: ${question}`,
    context ? `Contexto:\n${context}` : "Contexto: (não informado)",
  ].join("\n\n");

  try {
    const out = await deepseekChat([
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ]);

    return NextResponse.json({
      ok: true,
      provider: "deepseek",
      model: out.model,
      latencyMs: out.latencyMs,
      result: out.content,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, provider: "deepseek", error: String(e) },
      { status: 502 }
    );
  }
}
