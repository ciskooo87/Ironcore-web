import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listSopSteps } from "@/lib/sop";
import { buildWorkflowRuntime } from "@/lib/workflow";
import { getHistoricalUploadAggregate, getLatestHistoricalDiagnosis } from "@/lib/historical-diagnosis";
import { listHistoricalDiagnosisValidations } from "@/lib/historical-validation";
import { ensureCsrfCookie } from "@/lib/csrf";

const PHASE_LABEL: Record<string, string> = {
  IMPLEMENTACAO: "Implementação",
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

const HEALTH_CLASS: Record<string, string> = {
  funciona: "text-emerald-300",
  parcial: "text-amber-300",
  nao_funciona: "text-rose-300",
};

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

  return (
    <AppShell user={user} title="Projeto · Fluxo de Trabalho" subtitle="Planilha operacional traduzida para status real de execução no Ironcore">
      {query.saved ? <div className="alert ok-bg mb-4">{query.saved === "historical_diagnosis" ? "Diagnóstico histórico gerado." : query.saved === "historical_validation" ? "Validação do diagnóstico registrada." : "Ação concluída."}</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">{query.error === "historical_upload_missing" ? "Ainda não existe base histórica suficiente para gerar o diagnóstico." : query.error === "historical_diagnosis_error" ? "Falha ao gerar o diagnóstico histórico." : query.error}</div> : null}

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Etapas</div><div className="text-lg font-semibold mt-1">{runtime.length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Concluídas</div><div className="text-lg font-semibold mt-1">{totalDone}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Em validação</div><div className="text-lg font-semibold mt-1">{runtime.filter((r) => r.status === "aguardando_validacao").length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Bloqueadas</div><div className="text-lg font-semibold mt-1">{runtime.filter((r) => r.status === "bloqueado").length}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Diagnóstico histórico</h2><span className="kpi-chip">Implementação</span></div>
        <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
          <div className="metric"><div className="text-xs text-slate-400">Uploads históricos</div><div className="text-lg font-semibold mt-1">{historicalAggregate.totalUploads}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Última base</div><div className="text-lg font-semibold mt-1">{historicalAggregate.latestBusinessDate || "-"}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Cobertura por origem</div><div className="text-sm font-semibold mt-1">{Object.keys(historicalAggregate.byKind).length || 0} tipos</div></div>
        </div>

        <form action={`/api/projects/${id}/historical-diagnosis/run`} method="post" className="mt-3">
          <button type="submit" className="badge py-2 px-3 cursor-pointer">Gerar diagnóstico histórico</button>
        </form>

        <div className="mt-3 text-xs text-slate-400">
          {Object.entries(historicalAggregate.byKind).length > 0
            ? Object.entries(historicalAggregate.byKind).map(([k, v]) => `${k}: ${v}`).join(" · ")
            : "Nenhum upload histórico registrado ainda."}
        </div>

        {latestHistoricalDiagnosis ? (
          <div className="mt-4 rounded-lg border border-slate-800 p-3">
            <div className="text-sm font-medium">Último diagnóstico</div>
            <div className="text-xs text-slate-400 mt-1">{latestHistoricalDiagnosis.created_at} · {latestHistoricalDiagnosis.provider} · {latestHistoricalDiagnosis.model || "-"} · {latestHistoricalDiagnosis.status}</div>
            <pre className="text-xs text-slate-300 mt-3 whitespace-pre-wrap">{latestHistoricalDiagnosis.response || latestHistoricalDiagnosis.error || "Sem conteúdo."}</pre>

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

        <div className="mt-4 space-y-2 text-sm">
          {historicalValidations.length ? historicalValidations.map((v) => (
            <div key={v.id} className="rounded-lg border border-slate-800 p-3">
              <div className="font-medium">{v.decision}</div>
              <div className="text-xs text-slate-500 mt-1">{v.validated_at}</div>
              <div className="text-slate-300 mt-2 whitespace-pre-wrap">{v.summary_text || v.note || '-'}</div>
            </div>
          )) : null}
        </div>
      </section>

      {groups.map((phase) => {
        const items = runtime.filter((r) => r.phase === phase);
        return (
          <section key={phase} className="card mb-4">
            <div className="section-head"><h2 className="title">{PHASE_LABEL[phase]}</h2><span className="kpi-chip">{items.length} etapas</span></div>
            <div className="table-wrap mt-3">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="text-left px-2 py-2 border-b border-slate-800">Ordem</th>
                    <th className="text-left px-2 py-2 border-b border-slate-800">Função</th>
                    <th className="text-left px-2 py-2 border-b border-slate-800">Uso</th>
                    <th className="text-left px-2 py-2 border-b border-slate-800">Permissão</th>
                    <th className="text-left px-2 py-2 border-b border-slate-800">Modo de uso</th>
                    <th className="text-left px-2 py-2 border-b border-slate-800">Status</th>
                    <th className="text-left px-2 py-2 border-b border-slate-800">Saúde</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key} className="odd:bg-slate-900/30 align-top">
                      <td className="px-2 py-2 border-b border-slate-900">{item.order}</td>
                      <td className="px-2 py-2 border-b border-slate-900">
                        <div className="font-medium">{item.title}</div>
                        {item.updatedAt ? <div className="text-[11px] text-slate-500 mt-1">Atualizado: {item.updatedAt}</div> : null}
                      </td>
                      <td className="px-2 py-2 border-b border-slate-900">{item.usage}</td>
                      <td className="px-2 py-2 border-b border-slate-900">{item.ownerRole}</td>
                      <td className="px-2 py-2 border-b border-slate-900">
                        <div>{item.mode}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{item.reason}</div>
                        {item.counts ? <div className="text-[11px] text-slate-500 mt-1">{Object.entries(item.counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div> : null}
                      </td>
                      <td className="px-2 py-2 border-b border-slate-900">
                        <div>{STATUS_LABEL[item.status]}</div>
                        {item.evidence ? <div className="text-[11px] text-slate-500 mt-1">Evidência: {item.evidence}</div> : null}
                        {item.note ? <div className="text-[11px] text-slate-500 mt-1">Nota: {item.note}</div> : null}
                      </td>
                      <td className={`px-2 py-2 border-b border-slate-900 font-medium ${HEALTH_CLASS[item.health]}`}>{item.health.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </AppShell>
  );
}
