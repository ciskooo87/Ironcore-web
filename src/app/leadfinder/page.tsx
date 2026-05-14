import Link from "next/link";

const API_BASE = (process.env.LEADFINDER_API_URL || "http://127.0.0.1:8021").replace(/\/$/, "");

type SearchParams = Promise<{
  min_score?: string;
  tier?: string;
  sector?: string;
  match_quality?: string;
  company_query?: string;
  company_id?: string;
  generated?: string;
}>;

type RankingItem = {
  company_id: number;
  empresa: string;
  setor?: string | null;
  localizacao?: string | null;
  score: number;
  probabilidade_conversao: string;
  lead_tier: string;
  produto_mais_indicado: string;
  qualidade_match?: string | null;
  fontes_utilizadas: string[];
  principais_sinais_detectados: string[];
  atualizado_em: string;
};

type RankingResponse = {
  total: number;
  items: RankingItem[];
};

type ExecutiveLead = {
  company_id: number;
  empresa: string;
  setor?: string | null;
  localizacao?: string | null;
  porte_estimado?: string | null;
  score_necessidade_capital: number;
  probabilidade_conversao: string;
  score_bucket: string;
  qualidade_match?: string | null;
  principais_sinais_detectados: string[];
  eixos_de_evidencia: string[];
  motivos_do_score: string[];
  contexto_operacional: string;
  hipotese_de_dor: string;
  melhor_abordagem_comercial: string;
  produto_mais_indicado: string;
  timing_ideal_de_abordagem: string;
  risco: string;
  contatos_encontrados: string[];
  fontes_utilizadas: string[];
  confianca_do_lead: string;
  evidencias: string[];
  resumo_executivo: string;
  criado_em: string;
};

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function badgeTone(tier: string) {
  if (tier === "A") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (tier === "B") return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
  if (tier === "C") return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

function qualityTone(quality?: string | null) {
  if (quality === "alta") return "text-emerald-300";
  if (quality === "média") return "text-amber-200";
  if (quality === "baixa") return "text-rose-300";
  return "text-slate-400";
}

function queryFor(base: Record<string, string>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams(base);
  for (const [key, value] of Object.entries(patch)) {
    if (!value) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/leadfinder/?${qs}` : "/leadfinder/";
}

function fmtDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function LeadfinderPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const minScore = params.min_score || "60";
  const tier = params.tier || "";
  const sector = params.sector || "";
  const matchQuality = params.match_quality || "";
  const companyQuery = params.company_query || "";

  const currentQuery = {
    min_score: minScore,
    tier,
    sector,
    match_quality: matchQuality,
    company_query: companyQuery,
    company_id: params.company_id || "",
  };

  const rankingPath = `/leads/ranking?limit=20&min_score=${encodeURIComponent(minScore)}${tier ? `&tier=${encodeURIComponent(tier)}` : ""}${sector ? `&sector=${encodeURIComponent(sector)}` : ""}${matchQuality ? `&match_quality=${encodeURIComponent(matchQuality)}` : ""}${companyQuery ? `&company_query=${encodeURIComponent(companyQuery)}` : ""}`;
  const ranking = await apiFetch<RankingResponse>(rankingPath);
  const selectedCompanyId = params.company_id || ranking?.items?.[0]?.company_id?.toString() || "";
  const executive = selectedCompanyId ? await apiFetch<ExecutiveLead>(`/leads/${selectedCompanyId}/executive`) : null;
  const health = await apiFetch<{ status: string; service: string }>("/health");

  const metrics = [
    { label: "API", value: health?.status === "ok" ? "online" : "offline" },
    { label: "Leads ranqueados", value: String(ranking?.total ?? 0) },
    { label: "Filtro mínimo", value: minScore },
    { label: "Empresa em foco", value: executive?.empresa || "nenhuma" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_26%),linear-gradient(180deg,#040816_0%,#071121_100%)] text-slate-100">
      <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 xl:px-10">
        <header className="mb-8 rounded-[28px] border border-cyan-400/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">IronCore · Leadfinder</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white md:text-6xl">Radar executivo de leads com evidência real.</h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">Ranking operacional de empresas com provável necessidade de capital de giro, crédito estruturado ou funding de expansão — com score explicável, qualidade de match e leitura executiva pronta.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:min-w-[420px] xl:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{metric.label}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/65 p-5 shadow-[0_16px_50px_rgba(2,8,23,0.35)]">
              <div className="mb-4 text-sm font-semibold text-white">Filtros</div>
              <form action="/leadfinder/" className="grid gap-3 text-sm">
                <label className="grid gap-2">
                  <span className="text-slate-400">Buscar empresa</span>
                  <input name="company_query" defaultValue={companyQuery} placeholder="nome, setor ou cidade" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white" />
                </label>
                <label className="grid gap-2">
                  <span className="text-slate-400">Score mínimo</span>
                  <input name="min_score" defaultValue={minScore} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white" />
                </label>
                <label className="grid gap-2">
                  <span className="text-slate-400">Tier</span>
                  <select name="tier" defaultValue={tier} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white">
                    <option value="">Todos</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-slate-400">Setor</span>
                  <input name="sector" defaultValue={sector} placeholder="transportadora, distribuidora..." className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white" />
                </label>
                <label className="grid gap-2">
                  <span className="text-slate-400">Qualidade do match</span>
                  <select name="match_quality" defaultValue={matchQuality} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white">
                    <option value="">Todas</option>
                    <option value="alta">Alta</option>
                    <option value="média">Média</option>
                    <option value="baixa">Baixa</option>
                    <option value="desconhecida">Desconhecida</option>
                  </select>
                </label>
                <button className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950">Aplicar filtros</button>
              </form>
            </div>

            <div className="rounded-[24px] border border-slate-800 bg-slate-950/65 p-5 shadow-[0_16px_50px_rgba(2,8,23,0.35)]">
              <div className="mb-4 flex items-center justify-between text-sm font-semibold text-white">
                <span>Ranking operacional</span>
                <span className="text-xs font-normal text-slate-400">{ranking?.total ?? 0} resultados</span>
              </div>
              <div className="space-y-3">
                {ranking?.items?.length ? ranking.items.slice(0, 5).map((item, index) => (
                  <Link key={item.company_id} href={queryFor(currentQuery, { company_id: String(item.company_id) })} className={`block rounded-2xl border p-4 transition ${String(item.company_id) === selectedCompanyId ? "border-cyan-400/40 bg-cyan-400/10" : "border-slate-800 bg-slate-900/70 hover:border-slate-700"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">#{index + 1}</div>
                        <div className="mt-1 font-semibold text-white">{item.empresa}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.setor || "setor não informado"} · {item.localizacao || "local não informado"}</div>
                      </div>
                      <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone(item.lead_tier)}`}>{item.lead_tier}</div>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Score</div>
                        <div className="text-2xl font-semibold text-white">{item.score}</div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-slate-500">Match</div>
                        <div className={qualityTone(item.qualidade_match)}>{item.qualidade_match || "desconhecida"}</div>
                      </div>
                    </div>
                  </Link>
                )) : <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Nenhum lead encontrado com os filtros atuais.</div>}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-800 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(2,8,23,0.4)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Visão operacional</div>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Tabela de priorização</h2>
                </div>
                <div className="text-xs text-slate-400">Use a tabela para triagem rápida e os cards laterais para foco imediato.</div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Empresa</th>
                        <th className="px-4 py-3">Setor</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Tier</th>
                        <th className="px-4 py-3">Match</th>
                        <th className="px-4 py-3">Produto</th>
                        <th className="px-4 py-3">Atualizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {ranking?.items?.map((item) => (
                        <tr key={item.company_id} className={String(item.company_id) === selectedCompanyId ? "bg-cyan-400/5" : "hover:bg-slate-900/80"}>
                          <td className="px-4 py-4">
                            <Link href={queryFor(currentQuery, { company_id: String(item.company_id) })} className="font-semibold text-white hover:text-cyan-300">{item.empresa}</Link>
                            <div className="mt-1 text-xs text-slate-400">{item.localizacao || "local não informado"}</div>
                          </td>
                          <td className="px-4 py-4 text-slate-300">{item.setor || "-"}</td>
                          <td className="px-4 py-4 font-semibold text-white">{item.score}</td>
                          <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone(item.lead_tier)}`}>{item.lead_tier}</span></td>
                          <td className={`px-4 py-4 font-medium ${qualityTone(item.qualidade_match)}`}>{item.qualidade_match || "desconhecida"}</td>
                          <td className="px-4 py-4 text-slate-300">{item.produto_mais_indicado}</td>
                          <td className="px-4 py-4 text-slate-400">{fmtDate(item.atualizado_em)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-800 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(2,8,23,0.4)]">
              {executive ? (
                <>
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Lead executivo</div>
                      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">{executive.empresa}</h2>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-3 py-1 font-semibold ${badgeTone(executive.score_bucket === "oportunidade prioritária" ? "A" : executive.score_bucket === "alta probabilidade" ? "B" : executive.score_bucket === "média probabilidade" ? "C" : "D")}`}>{executive.score_bucket}</span>
                        <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">{executive.setor || "setor não informado"}</span>
                        <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">{executive.localizacao || "local não informado"}</span>
                        <span className={`rounded-full border border-slate-700 px-3 py-1 ${qualityTone(executive.qualidade_match)}`}>match {executive.qualidade_match || "desconhecida"}</span>
                      </div>
                    </div>
                    <form action={`/api/leadfinder/generate/${executive.company_id}`} method="post">
                      <button className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">Gerar novo snapshot</button>
                    </form>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Score</div><div className="mt-2 text-3xl font-semibold text-white">{executive.score_necessidade_capital}</div></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Conversão</div><div className="mt-2 text-lg font-semibold text-white">{executive.probabilidade_conversao}</div></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Produto</div><div className="mt-2 text-lg font-semibold text-white">{executive.produto_mais_indicado}</div></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Confiança</div><div className="mt-2 text-lg font-semibold text-white">{executive.confianca_do_lead}</div></div>
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="text-sm font-semibold text-white">Resumo executivo</div><p className="mt-3 text-sm leading-7 text-slate-300">{executive.resumo_executivo}</p></div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="text-sm font-semibold text-white">Hipótese de dor</div><p className="mt-3 text-sm leading-7 text-slate-300">{executive.hipotese_de_dor}</p></div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="text-sm font-semibold text-white">Melhor abordagem comercial</div><p className="mt-3 text-sm leading-7 text-slate-300">{executive.melhor_abordagem_comercial}</p></div>
                    </div>
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="text-sm font-semibold text-white">Motivos do score</div><div className="mt-3 space-y-2">{executive.motivos_do_score.map((reason) => <div key={reason} className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">{reason}</div>)}</div></div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="text-sm font-semibold text-white">Eixos de evidência</div><div className="mt-3 flex flex-wrap gap-2">{executive.eixos_de_evidencia.map((axis) => <span key={axis} className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{axis}</span>)}</div></div>
                    </div>
                  </div>
                </>
              ) : <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">Não consegui carregar o lead executivo. Verifique se a API do Leadfind está online em <code className="text-slate-200">{API_BASE}</code>.</div>}
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
