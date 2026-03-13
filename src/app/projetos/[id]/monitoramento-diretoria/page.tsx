import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
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

  const tone = snap.alertasCriticos > 0 || snap.conciliacoesBloqueadas > 0 ? "bad" : "good";

  return (
    <AppShell user={user} title="Projeto · Monitoramento Diretoria" subtitle="Visão consolidada para diretoria: resultado, risco, fechamento e leitura executiva em uma camada pronta para gestão.">
      <ProductHero
        eyebrow="camada diretoria"
        title="A diretoria precisa bater o olho e entender saúde, risco, fechamento e pressão do projeto sem mergulhar no operacional."
        description="Esta tela consolida os principais sinais do projeto em uma leitura executiva direta, pronta para acompanhamento e tomada de decisão."
      >
        <StatusPill label={tone === "bad" ? "Atenção executiva" : "Leitura estável"} tone={tone} />
      </ProductHero>

      <section className="grid md:grid-cols-5 gap-3 mb-4">
        <MetricCard label="Último fechamento" value={snap.latestClosurePeriod || '-'} />
        <MetricCard label="Última validação" value={snap.latestValidationDecision || '-'} tone={snap.latestValidationDecision === 'bloquear' ? 'bad' : snap.latestValidationDecision === 'ajustar' ? 'warn' : 'good'} />
        <MetricCard label="Faturamento" value={br(snap.faturamento)} />
        <MetricCard label="Resultado operacional" value={br(snap.resultadoOperacional)} tone={snap.resultadoOperacional >= 0 ? 'good' : 'bad'} />
        <MetricCard label="Carteira vencida" value={br(snap.carteiraVencida)} tone={snap.carteiraVencida > 0 ? 'bad' : 'good'} />
      </section>

      <section className="grid md:grid-cols-3 gap-3 mb-4">
        <MetricCard label="Alertas críticos" value={snap.alertasCriticos} tone={snap.alertasCriticos > 0 ? 'bad' : 'good'} />
        <MetricCard label="Conciliações bloqueadas" value={snap.conciliacoesBloqueadas} tone={snap.conciliacoesBloqueadas > 0 ? 'bad' : 'good'} />
        <MetricCard label="Data da última validação" value={snap.latestValidationAt || '-'} />
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Leitura executiva</h2><span className="kpi-chip">pronto para diretoria</span></div>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-300 whitespace-pre-wrap">
          {snap.narrative || 'Sem narrativa executiva consolidada ainda.'}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Histórico de validações</h2><span className="kpi-chip">decisões</span></div>
          <div className="mt-3 space-y-2 text-sm">
            {validations.length ? validations.map((v) => (
              <div key={v.id} className="rounded-lg border border-slate-800 p-3">
                <div className="font-medium">{v.decision}</div>
                <div className="text-xs text-slate-500 mt-1">{v.validated_at}</div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{v.summary_text || v.note || '-'}</div>
              </div>
            )) : <EmptyState title="Sem validações ainda" description="As validações executivas vão aparecer aqui assim que os fechamentos começarem a ser revisados." />}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Histórico de fechamentos</h2><span className="kpi-chip">memória do projeto</span></div>
          <div className="mt-3 space-y-2 text-sm">
            {closures.length ? closures.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-800 p-3">
                <div className="font-medium">{c.period_ym} · v{c.snapshot_version}</div>
                <div className="text-xs text-slate-500 mt-1">{c.created_at}</div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{String((c.snapshot as any)?.narrativaExecutiva || '-')}</div>
              </div>
            )) : <EmptyState title="Sem fechamentos ainda" description="Quando o projeto acumular fechamentos, esta área vira a trilha executiva da evolução mensal." />}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
