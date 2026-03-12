import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getUsageKpis } from "@/lib/kpis";

export default async function AuditoriaUsoPage() {
  const user = await requireUser();
  const k = await getUsageKpis();
  const successRate = k.routineTotal > 0 ? (k.routineSuccess / k.routineTotal) * 100 : 0;

  return (
    <AppShell user={user} title="Governança · Auditoria de Uso" subtitle="Leitura executiva de adoção e operação do produto nos últimos 30 dias.">
      <ProductHero
        eyebrow="governança do produto"
        title="A auditoria de uso precisa mostrar se o Ironcore está sendo adotado e se o motor está realmente sendo usado."
        description="Esta tela transforma o histórico operacional em leitura de produto: adoção, confiabilidade e pressão operacional em um só lugar."
      />

      <section className="grid md:grid-cols-7 gap-3 mb-4">
        <MetricCard label="Usuários ativos" value={k.activeUsers} />
        <MetricCard label="Projetos ativos" value={k.activeProjects} />
        <MetricCard label="Rotinas executadas" value={k.routineTotal} />
        <MetricCard label="Taxa de sucesso" value={`${successRate.toFixed(1)}%`} tone={successRate >= 85 ? "good" : successRate >= 60 ? "warn" : "bad"} />
        <MetricCard label="Inconsistências" value={k.inconsistencies} tone={k.inconsistencies > 0 ? "warn" : "good"} />
        <MetricCard label="Envios automáticos" value={k.deliverySent} />
        <MetricCard label="Conciliações manuais" value={k.manualReconciliations} tone={k.manualReconciliations > 0 ? "warn" : "good"} />
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Módulos mais usados</h2><span className="kpi-chip">adoção funcional</span></div>
        <div className="mt-3 space-y-2 text-sm">
          {k.topModules.length === 0 ? <EmptyState title="Sem dados de adoção ainda" description="Ainda não há massa suficiente para mostrar quais áreas do produto estão sendo mais usadas." /> : null}
          {k.topModules.map((m) => (
            <div key={m.entity} className="row"><span>{m.entity}</span><span className="badge">{m.c}</span></div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
