import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listSopSteps } from "@/lib/sop";
import { buildWorkflowRuntime } from "@/lib/workflow";

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

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Fluxo de Trabalho"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Fluxo de Trabalho"><div className="alert bad-bg">Sem permissão.</div></AppShell>;

  const sopSteps = await listSopSteps(project.id);
  const runtime = await buildWorkflowRuntime(project, sopSteps);

  const groups = ["IMPLEMENTACAO", "OPERACAO_DIARIA", "FECHAMENTO"] as const;
  const totalDone = runtime.filter((r) => r.status === "concluido").length;

  return (
    <AppShell user={user} title="Projeto · Fluxo de Trabalho" subtitle="Planilha operacional traduzida para status real de execução no Ironcore">
      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Etapas</div><div className="text-lg font-semibold mt-1">{runtime.length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Concluídas</div><div className="text-lg font-semibold mt-1">{totalDone}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Em validação</div><div className="text-lg font-semibold mt-1">{runtime.filter((r) => r.status === "aguardando_validacao").length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Bloqueadas</div><div className="text-lg font-semibold mt-1">{runtime.filter((r) => r.status === "bloqueado").length}</div></div>
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
