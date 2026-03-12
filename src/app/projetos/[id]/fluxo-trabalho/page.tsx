import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listSopSteps } from "@/lib/sop";
import { buildWorkflowRuntime } from "@/lib/workflow";
import { getHistoricalUploadAggregate, getLatestHistoricalDiagnosis } from "@/lib/historical-diagnosis";
import { listHistoricalDiagnosisValidations } from "@/lib/historical-validation";
import { ensureCsrfCookie } from "@/lib/csrf";

const PHASE_LABEL: Record<string, string> = {
  IMPLEMENTACAO: "Implantação",
  OPERACAO_DIARIA: "Operação diária",
  FECHAMENTO: "Fechamento",
};

const STATUS_LABEL: Record<string, string> = {
  nao_iniciado: "Não iniciado",
  em_execucao: "Em execução",
  aguardando_validacao: "Aguardando validação",
  concluido: "Concluído",
  bloqueado: "Bloqueado",
};

const HEALTH_LABEL: Record<string, string> = {
  funciona: "funciona",
  parcial: "parcial",
  nao_funciona: "não funciona",
};

function toneClasses(status: string) {
  if (status === "bloqueado") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (status === "aguardando_validacao" || status === "em_execucao") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (status === "concluido") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  return "border-slate-600 bg-slate-800/40 text-slate-200";
}

function healthTone(health: string) {
  if (health === "nao_funciona") return "text-rose-300";
  if (health === "parcial") return "text-amber-300";
  return "text-emerald-300";
}

function parseJsonFence(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function summarizeDiagnosis(raw: string | null) {
  if (!raw) return "Sem diagnóstico histórico gerado ainda.";
  try {
    const parsed = JSON.parse(parseJsonFence(raw)) as Record<string, any>;
    return String(parsed.executiveSummary || parsed.diagnosis?.dataQuality || raw).slice(0, 420);
  } catch {
    return raw.slice(0, 420);
  }
}

function phaseNarrative(phase: string, done: number, total: number, blocked: number, waiting: number) {
  if (phase === "IMPLEMENTACAO") {
    if (blocked > 0) return "A implantação está travada e precisa de saneamento antes de seguir.";
    if (done === total) return "A estrutura base do projeto já está pronta para operar.";
    return "A implantação ainda está em construção; faltam peças estruturais para dar confiança ao motor.";
  }
  if (phase === "OPERACAO_DIARIA") {
    if (blocked > 0) return "A operação diária encontrou bloqueios que impedem decisão limpa do dia.";
    if (waiting > 0) return "A operação rodou, mas ainda depende de validação humana para fechar o ciclo.";
    return "A rotina diária está saudável e caminhando com baixa fricção.";
  }
  if (blocked > 0) return "O fechamento possui travas que impedem consolidar o ciclo com confiança.";
  if (waiting > 0) return "O fechamento já tem material, mas ainda pede validação final.";
  return "O fechamento está estruturado e pronto para consolidar leitura executiva.";
}

function progressWidth(done: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (done / total) * 100));
}

export default async function WorkflowPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);
  const query = await searchParams;

  if (!project) return <AppShell user={user} title="Projeto · Fluxo de Trabalho"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Fluxo de Trabalho"><div className="alert bad-bg">Sem permissão.</div></AppShell>;

  const sopSteps = await listSopSteps(project.id);
  const runtime = await buildWorkflowRuntime(project, sopSteps);
  const [historicalAggregate, latestHistoricalDiagnosis, historicalValidations, csrf] = await Promise.all([
    getHistoricalUploadAggregate(project.id),
    getLatestHistoricalDiagnosis(project.id),
    listHistoricalDiagnosisValidations(project.id, 20),
    ensureCsrfCookie(),
  ]);

  const groups = ["IMPLEMENTACAO", "OPERACAO_DIARIA", "FECHAMENTO"] as const;
  const totalDone = runtime.filter((r) => r.status === "concluido").length;
  const totalBlocked = runtime.filter((r) => r.status === "bloqueado").length;
  const totalWaiting = runtime.filter((r) => r.status === "aguardando_validacao").length;
  const overallTone = totalBlocked > 0 ? "bad" : totalWaiting > 0 ? "warn" : "good";
  const overallLabel = totalBlocked > 0 ? "Fluxo com bloqueio" : totalWaiting > 0 ? "Fluxo aguardando validação" : "Fluxo saudável";

  const phaseCards = groups.map((phase) => {
    const items = runtime.filter((r) => r.phase === phase);
    const done = items.filter((item) => item.status === "concluido").length;
    const blocked = items.filter((item) => item.status === "bloqueado").length;
    const waiting = items.filter((item) => item.status === "aguardando_validacao").length;
    const inProgress = items.filter((item) => item.status === "em_execucao").length;

    return {
      phase,
      title: PHASE_LABEL[phase],
      items,
      done,
      blocked,
      waiting,
      inProgress,
      total: items.length,
      narrative: phaseNarrative(phase, done, items.length, blocked, waiting),
    };
  });

  return (
    <AppShell user={user} title="Projeto · Fluxo de Trabalho" subtitle="Timeline executiva do que já foi construído, do que trava o fluxo e do que ainda precisa de validação para o projeto andar limpo">
      {query.saved ? <div className="alert ok-bg mb-4">{query.saved === "historical_diagnosis" ? "Diagnóstico histórico gerado." : query.saved === "historical_validation" ? "Validação do diagnóstico registrada." : "Ação concluída."}</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">{query.error === "historical_upload_missing" ? "Ainda não existe base histórica suficiente para gerar o diagnóstico." : query.error === "historical_diagnosis_error" ? "Falha ao gerar o diagnóstico histórico." : query.error}</div> : null}

      <ProductHero
        eyebrow="timeline premium de execução"
        title="O fluxo precisa mostrar onde o projeto está, o que trava e o que falta validar."
        description="Aqui a trilha do Ironcore deixa de ser checklist técnica e vira uma leitura viva do projeto: implantação, operação e fechamento em uma só narrativa."
      >
        <StatusPill label={overallLabel} tone={overallTone} />
      </ProductHero>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Etapas totais</div><div className="text-lg font-semibold mt-1">{runtime.length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Concluídas</div><div className="text-lg font-semibold mt-1 text-emerald-200">{totalDone}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Aguardando validação</div><div className="text-lg font-semibold mt-1 text-amber-200">{totalWaiting}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Bloqueadas</div><div className="text-lg font-semibold mt-1 text-rose-200">{totalBlocked}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Timeline por fase</h2><span className="kpi-chip">visão macro</span></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {phaseCards.map((phase) => (
            <article key={phase.phase} className="rounded-[24px] border border-slate-800 bg-slate-950/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{phase.title}</h3>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${phase.blocked > 0 ? toneClasses("bloqueado") : phase.waiting > 0 || phase.inProgress > 0 ? toneClasses("aguardando_validacao") : toneClasses("concluido")}`}>
                  {phase.done}/{phase.total}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{phase.narrative}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${progressWidth(phase.done, phase.total)}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-slate-400">Concluído</div><div className="mt-1 font-semibold text-emerald-200">{phase.done}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-slate-400">Validação</div><div className="mt-1 font-semibold text-amber-200">{phase.waiting}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-slate-400">Bloqueio</div><div className="mt-1 font-semibold text-rose-200">{phase.blocked}</div></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Diagnóstico histórico</h2><span className="kpi-chip">implantação</span></div>
        <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
          <div className="metric"><div className="text-xs text-slate-400">Uploads históricos</div><div className="text-lg font-semibold mt-1">{historicalAggregate.totalUploads}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Última base</div><div className="text-lg font-semibold mt-1">{historicalAggregate.latestBusinessDate || "-"}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Cobertura por origem</div><div className="text-sm font-semibold mt-1">{Object.keys(historicalAggregate.byKind).length || 0} tipos</div></div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <form action={`/api/projects/${id}/historical-diagnosis/run`} method="post">
            <button type="submit" className="badge py-2 px-3 cursor-pointer">Gerar diagnóstico histórico</button>
          </form>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          {Object.entries(historicalAggregate.byKind).length > 0
            ? Object.entries(historicalAggregate.byKind).map(([k, v]) => `${k}: ${v}`).join(" · ")
            : "Nenhum upload histórico registrado ainda."}
        </div>

        {latestHistoricalDiagnosis ? (
          <div className="mt-4 rounded-[24px] border border-slate-800 bg-slate-950/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">Último diagnóstico</div>
                <div className="text-xs text-slate-400 mt-1">{latestHistoricalDiagnosis.created_at} · {latestHistoricalDiagnosis.provider} · {latestHistoricalDiagnosis.model || "-"} · {latestHistoricalDiagnosis.status}</div>
              </div>
              <span className="pill">IA executiva</span>
            </div>
            <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{summarizeDiagnosis(latestHistoricalDiagnosis.response || latestHistoricalDiagnosis.error || null)}</div>

            <form action={`/api/projects/${id}/historical-diagnosis/validate`} method="post" className="grid md:grid-cols-4 gap-2 text-sm mt-4">
              <input type="hidden" name="csrf_token" value={csrf} />
              <input type="hidden" name="inference_run_id" value={latestHistoricalDiagnosis.id} />
              <select name="decision" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
                <option value="aprovado">Aprovar diagnóstico</option>
                <option value="ajustar">Enviar para ajuste</option>
                <option value="bloquear">Bloquear diagnóstico</option>
              </select>
              <input name="note" placeholder="nota da validação" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
              <button type="submit" className="badge py-2 px-3 cursor-pointer">Validar diagnóstico</button>
            </form>
          </div>
        ) : null}

        {historicalValidations.length ? (
          <div className="mt-4 space-y-2 text-sm">
            {historicalValidations.map((v) => (
              <div key={v.id} className="rounded-xl border border-slate-800 p-3">
                <div className="row"><span className="font-medium text-slate-100">{v.decision}</span><span className="text-xs text-slate-500">{v.validated_at}</span></div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{v.summary_text || v.note || "-"}</div>
              </div>
            ))}
          </div>
        ) : <div className="mt-4"><EmptyState title="Nenhuma validação histórica registrada ainda" description="Quando o diagnóstico histórico começar a ser validado, a trilha executiva dessa etapa vai aparecer aqui." /></div>}
      </section>

      {phaseCards.map((phase) => (
        <section key={phase.phase} className="card mb-4">
          <div className="section-head"><h2 className="title">{phase.title}</h2><span className="kpi-chip">{phase.total} etapas</span></div>
          <div className="mt-4 space-y-3">
            {phase.items.map((item) => (
              <article key={item.key} className="rounded-[24px] border border-slate-800 bg-slate-950/20 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="pill">#{item.order}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses(item.status)}`}>{STATUS_LABEL[item.status]}</span>
                      <span className={`text-xs font-medium uppercase tracking-wide ${healthTone(item.health)}`}>{HEALTH_LABEL[item.health]}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{item.reason}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 px-3 py-2 text-xs text-slate-300">
                    <div><b>Responsável:</b> {item.ownerRole}</div>
                    <div className="mt-1"><b>Uso:</b> {item.usage}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
                  <div className="rounded-2xl border border-slate-800 p-3">
                    <div className="text-xs text-slate-400">Modo de uso</div>
                    <div className="mt-1 text-slate-200">{item.mode}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 p-3">
                    <div className="text-xs text-slate-400">Evidência</div>
                    <div className="mt-1 text-slate-200">{item.evidence || "Sem evidência registrada ainda."}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 p-3">
                    <div className="text-xs text-slate-400">Nota / atualização</div>
                    <div className="mt-1 text-slate-200">{item.note || item.updatedAt || "Sem nota registrada ainda."}</div>
                  </div>
                </div>

                {item.counts ? (
                  <div className="mt-3 rounded-2xl border border-slate-800 p-3 text-xs text-slate-400">
                    {Object.entries(item.counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
