import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listClosures } from "@/lib/closure";
import { listClosureValidations } from "@/lib/closure-validation";
import { ensureCsrfCookie } from "@/lib/csrf";

function br(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

function currentYm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function toneClasses(value: number) {
  if (value < 0) return "text-rose-300";
  if (value === 0) return "text-slate-200";
  return "text-emerald-300";
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Fechamento Mensal"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Fechamento Mensal"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  const onboardingComplete = isProjectOnboardingComplete(project);
  if (!onboardingComplete) return <AppShell user={user} title="Projeto · Fechamento Mensal"><div className="alert bad-bg">Onboarding incompleto. Conclua o Cadastro antes de fechar o mês.</div></AppShell>;

  const [closures, validations, csrf] = await Promise.all([
    listClosures(project.id, 24),
    listClosureValidations(project.id, 20),
    ensureCsrfCookie(),
  ]);
  const latest = closures[0];
  const lastSnapshot = (latest?.snapshot || {}) as Record<string, unknown>;
  const resumo = (lastSnapshot.resumoMensal || {}) as Record<string, number>;
  const obs = (lastSnapshot.observaveis || {}) as Record<string, number>;
  const accountingFeed = (lastSnapshot.accountingFeed || {}) as Record<string, any>;
  const narrativaExecutiva = String(lastSnapshot.narrativaExecutiva || "");

  return (
    <AppShell user={user} title="Projeto · Fechamento Mensal" subtitle="Cockpit mensal do produto: fechar, entender o resultado, validar e entregar uma narrativa pronta para diretoria.">
      <section className="mb-4 rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(14,116,144,0.22),rgba(15,23,42,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              fechamento executivo
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">O fechamento mensal precisa sair daqui com cara de entrega final, não de etapa técnica solta.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
              Esta tela junta fechamento, validação, narrativa executiva e evolução mensal para virar uma peça real de gestão e diretoria.
            </p>
          </div>
          <form action={`/api/projects/${id}/fechamento/close`} method="post" className="flex gap-2 items-center flex-wrap">
            <input name="period_ym" placeholder="YYYY-MM" pattern="\d{4}-\d{2}" defaultValue={currentYm()} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
            <button className="badge py-2 px-4 cursor-pointer" type="submit">Fechar mês</button>
          </form>
        </div>
        {query.saved ? <div className="alert ok-bg mt-3">{query.saved === "validation" ? "Validação do fechamento registrada." : "Fechamento realizado."}</div> : null}
        {query.error ? <div className="alert bad-bg mt-3">Erro: {query.error}</div> : null}
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Faturamento</div><div className={`text-lg font-semibold mt-1 ${toneClasses(Number(resumo.faturamento || 0))}`}>{br(Number(resumo.faturamento || 0))}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Resultado operacional</div><div className={`text-lg font-semibold mt-1 ${toneClasses(Number(resumo.resultadoOperacional || 0))}`}>{br(Number(resumo.resultadoOperacional || 0))}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Conciliações bloqueadas</div><div className="text-lg font-semibold mt-1">{Number(obs.conciliacoesBloqueadas || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Alertas críticos</div><div className="text-lg font-semibold mt-1">{Number(obs.alertasCriticosAtivos || 0)}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Narrativa executiva</h2><span className="kpi-chip">board ready</span></div>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-300 whitespace-pre-wrap">
          {narrativaExecutiva || "Sem narrativa executiva ainda."}
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">DRE · receita bruta</div><div className="text-lg font-semibold mt-1">{br(accountingFeed?.dre?.receitaBruta || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">DRE · resultado líquido proxy</div><div className="text-lg font-semibold mt-1">{br(accountingFeed?.dre?.resultadoLiquidoProxy || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">DFC · saldo caixa proxy</div><div className="text-lg font-semibold mt-1">{br(accountingFeed?.dfc?.saldoCaixaProxy || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira vencida</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(accountingFeed?.carteira?.vencido || 0)}</div></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Validar fechamento</h2><span className="kpi-chip">workflow</span></div>
          <form action={`/api/projects/${id}/closure/validate`} method="post" className="grid md:grid-cols-4 gap-2 text-sm mt-3">
            <input type="hidden" name="csrf_token" value={csrf} />
            <select name="closure_id" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
              {closures.map((c) => <option key={c.id} value={c.id}>{c.period_ym} · v{c.snapshot_version}</option>)}
            </select>
            <select name="decision" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
              <option value="aprovado">Aprovar fechamento</option>
              <option value="ajustar">Enviar para ajuste</option>
              <option value="bloquear">Bloquear fechamento</option>
            </select>
            <input name="note" placeholder="nota da validação" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 px-3 cursor-pointer">Registrar validação</button>
          </form>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Validações registradas</h2><span className="kpi-chip">trilha decisória</span></div>
          <div className="mt-3 space-y-2 text-sm">
            {validations.length ? validations.map((v) => (
              <div key={v.id} className="rounded-2xl border border-slate-800 p-4">
                <div className="font-medium text-white">{v.decision}</div>
                <div className="text-xs text-slate-500 mt-1">{v.validated_at}</div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{v.summary_text || v.note || '-'}</div>
              </div>
            )) : <div className="alert muted-bg">Sem validações registradas ainda.</div>}
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Evolução mensal</h2><span className="kpi-chip">narrativa contínua</span></div>
        <div className="table-wrap mt-3">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Período</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Versão</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Faturamento</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Receber</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Pagar</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {closures.length === 0 ? (
                <tr><td className="px-2 py-3 text-center text-slate-400" colSpan={6}>Sem fechamentos.</td></tr>
              ) : (
                closures.map((c) => {
                  const s = (c.snapshot || {}) as Record<string, unknown>;
                  const r = (s.resumoMensal || {}) as Record<string, number>;
                  return (
                    <tr key={c.id} className="odd:bg-slate-900/30">
                      <td className="px-2 py-1.5 border-b border-slate-900">{c.period_ym}</td>
                      <td className="px-2 py-1.5 border-b border-slate-900">v{c.snapshot_version}</td>
                      <td className="px-2 py-1.5 border-b border-slate-900 text-right">{br(Number(r.faturamento || 0))}</td>
                      <td className="px-2 py-1.5 border-b border-slate-900 text-right">{br(Number(r.contasReceber || 0))}</td>
                      <td className="px-2 py-1.5 border-b border-slate-900 text-right">{br(Number(r.contasPagar || 0))}</td>
                      <td className={`px-2 py-1.5 border-b border-slate-900 text-right ${toneClasses(Number(r.resultadoOperacional || 0))}`}>{br(Number(r.resultadoOperacional || 0))}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Snapshots técnicos</h2><span className="kpi-chip">auditoria</span></div>
        <div className="mt-3 space-y-2 text-sm">
          {closures.map((c) => (
            <details key={`${c.id}-raw`} className="rounded-lg border border-slate-800 p-2">
              <summary className="cursor-pointer">{c.period_ym} · v{c.snapshot_version} · {c.status}</summary>
              <pre className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">{JSON.stringify(c.snapshot, null, 2)}</pre>
            </details>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
