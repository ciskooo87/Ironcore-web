import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { getExecutiveMonitoringSnapshot } from "@/lib/executive-monitoring";
import { listClosureValidations } from "@/lib/closure-validation";
import { listClosures } from "@/lib/closure";

function br(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Monitoramento Diretoria"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Monitoramento Diretoria"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  if (!isProjectOnboardingComplete(project)) return <AppShell user={user} title="Projeto · Monitoramento Diretoria"><div className="alert bad-bg">Onboarding incompleto.</div></AppShell>;

  const [snap, validations, closures] = await Promise.all([
    getExecutiveMonitoringSnapshot(project.id),
    listClosureValidations(project.id, 12),
    listClosures(project.id, 12),
  ]);

  return (
    <AppShell user={user} title="Projeto · Monitoramento Diretoria" subtitle="Visão executiva consolidada para acompanhamento do projeto">
      <section className="grid md:grid-cols-5 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Último fechamento</div><div className="text-lg font-semibold mt-1">{snap.latestClosurePeriod || '-'}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Última validação</div><div className="text-lg font-semibold mt-1">{snap.latestValidationDecision || '-'}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Faturamento</div><div className="text-lg font-semibold mt-1">{br(snap.faturamento)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Resultado operacional</div><div className="text-lg font-semibold mt-1">{br(snap.resultadoOperacional)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira vencida</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(snap.carteiraVencida)}</div></div>
      </section>

      <section className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Alertas críticos</div><div className="text-lg font-semibold mt-1">{snap.alertasCriticos}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Conciliações bloqueadas</div><div className="text-lg font-semibold mt-1">{snap.conciliacoesBloqueadas}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Validação em</div><div className="text-lg font-semibold mt-1">{snap.latestValidationAt || '-'}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Leitura executiva</h2><span className="kpi-chip">Etapa 8</span></div>
        <div className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">{snap.narrative || 'Sem narrativa executiva consolidada ainda.'}</div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Histórico de validações</h2><span className="kpi-chip">Fechamento</span></div>
          <div className="mt-3 space-y-2 text-sm">
            {validations.length ? validations.map((v) => (
              <div key={v.id} className="rounded-lg border border-slate-800 p-3">
                <div className="font-medium">{v.decision}</div>
                <div className="text-xs text-slate-500 mt-1">{v.validated_at}</div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{v.summary_text || v.note || '-'}</div>
              </div>
            )) : <div className="alert muted-bg">Sem validações ainda.</div>}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Histórico de fechamentos</h2><span className="kpi-chip">Board</span></div>
          <div className="mt-3 space-y-2 text-sm">
            {closures.length ? closures.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-800 p-3">
                <div className="font-medium">{c.period_ym} · v{c.snapshot_version}</div>
                <div className="text-xs text-slate-500 mt-1">{c.created_at}</div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{String((c.snapshot as any)?.narrativaExecutiva || '-')}</div>
              </div>
            )) : <div className="alert muted-bg">Sem fechamentos ainda.</div>}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
