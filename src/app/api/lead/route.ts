import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { validateCsrf } from "@/lib/csrf";
import { dispatchLeadTelegram } from "@/lib/notify";

function safe(v: FormDataEntryValue | null, max = 255) {
  return String(v || "").trim().slice(0, max);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(new URL("/lp/?lead=csrf", req.url));

  const name = safe(form.get("name"), 120);
  const email = safe(form.get("email"), 180).toLowerCase();
  const company = safe(form.get("company"), 180);
  const phone = safe(form.get("phone"), 60);
  const message = safe(form.get("message"), 2000);
  const segment = safe(form.get("segment"), 40) || "geral";

  if (!name || !email) return NextResponse.redirect(new URL(`/lp/${segment}/?lead=required`, req.url));

  try {
    await dbQuery(
      "insert into lp_leads(name,email,company,phone,message,segment) values($1,$2,$3,$4,$5,$6)",
      [name, email, company || null, phone || null, message || null, segment]
    );

    const text = [
      "🚀 Novo lead no Ironcore LP",
      `Segmento: ${segment}`,
      `Nome: ${name}`,
      `Email: ${email}`,
      `Empresa: ${company || "-"}`,
      `Telefone: ${phone || "-"}`,
      `Mensagem: ${message || "-"}`,
    ].join("\n");

    await dispatchLeadTelegram(text);

    return NextResponse.redirect(new URL(`/lp/${segment}/?lead=ok`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/lp/${segment}/?lead=error`, req.url));
  }
}
