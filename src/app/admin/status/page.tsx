import { AppShell } from "@/components/AppShell";
import { MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getOpsStatus } from "@/lib/ops-status";

export default async function AdminStatusPage() {
  const user = await requireUser();
  const s = await getOpsStatus();

  return (
    <AppShell user={user} title="Governança · Status Ops" subtitle="Saúde operacional da plataforma: infraestrutura, integrações e sinais de falha recentes.">
      <ProductHero
        eyebrow="saúde operacional"
        title="O status ops precisa mostrar rápido se a plataforma está saudável ou se existe risco técnico afetando a operação."
        description="Esta tela resume a camada técnica em linguagem de produto: banco, delivery, rotinas bloqueadas e integrações essenciais."
      >
        <StatusPill label={s.db.ok ? "Plataforma saudável" : "Falha crítica no banco"} tone={s.db.ok ? "good" : "bad"} />
      </ProductHero>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Database" value={s.db.ok ? "OK" : "DOWN"} tone={s.db.ok ? "good" : "bad"} hint={s.db.now} />
        <MetricCard label="Falhas delivery 24h" value={s.failedDeliveries24h} tone={s.failedDeliveries24h > 0 ? "warn" : "good"} />
        <MetricCard label="Rotinas bloqueadas 24h" value={s.blockedRoutines24h} tone={s.blockedRoutines24h > 0 ? "warn" : "good"} />
        <MetricCard label="Hora do banco" value={s.db.now} />
      </section>

      <section className="card mt-4">
        <div className="section-head"><h2 className="title">Integrações</h2><span className="kpi-chip">camada externa</span></div>
        <div className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
          <div className={`alert ${s.integrations.telegram ? "ok-bg" : "bad-bg"}`}>Telegram: {s.integrations.telegram ? "configurado" : "faltando configuração"}</div>
          <div className={`alert ${s.integrations.whatsapp ? "ok-bg" : "bad-bg"}`}>WhatsApp: {s.integrations.whatsapp ? "configurado" : "faltando configuração"}</div>
          <div className={`alert ${s.integrations.email ? "ok-bg" : "bad-bg"}`}>Email: {s.integrations.email ? "configurado" : "faltando configuração"}</div>
        </div>
      </section>
    </AppShell>
  );
}
