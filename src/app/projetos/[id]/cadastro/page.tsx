import { AppShell } from "@/components/AppShell";
import { ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, getProjectOnboardingChecks, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);
  const query = await searchParams;

  const allowed = project ? await canAccessProject(user, project.id) : false;
  const onboardingChecks = project ? getProjectOnboardingChecks(project) : [];
  const onboardingComplete = project ? isProjectOnboardingComplete(project) : false;
  const pendingChecks = onboardingChecks.filter((item) => !item.done).length;

  return (
    <AppShell user={user} title="Projeto · Cadastro" subtitle="Base estrutural e parâmetros do projeto para destravar o resto do produto">
      <ProductHero
        eyebrow="base estrutural"
        title="Cadastro é onde o projeto ganha estrutura para operar sem gambiarra."
        description="A tela agora organiza importação, checklist de onboarding e dados mestres com mais clareza de produto: o que falta, o que trava e o que já está pronto."
      >
        <StatusPill label={onboardingComplete ? 'Onboarding concluído' : `${pendingChecks} pendência(s)`} tone={onboardingComplete ? 'good' : 'warn'} />
      </ProductHero>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando do onboarding</h2><span className="kpi-chip">prioridade estrutural</span></div>
          {project ? (
            <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
                <div className="mt-2 text-lg font-semibold text-white">{onboardingComplete ? 'Base estrutural pronta para operar.' : `Fechar ${pendingChecks} item(ns) do checklist antes de seguir.`}</div>
                <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Impacto</div>
                <div className="mt-2 text-sm text-slate-300">Enquanto o onboarding não estiver completo, o sistema bloqueia avanço real para risco, operação diária, operações, fluxo de caixa e fechamento.</div>
              </div>
              <div className={`rounded-[24px] border p-4 text-sm ${onboardingComplete ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}>
                <div className="font-medium">Checklist de onboarding {onboardingComplete ? "concluído" : "incompleto"}</div>
                <div className="mt-2 grid gap-1 text-xs">
                  {onboardingChecks.map((item) => (
                    <div key={item.key} className={item.done ? "text-emerald-300" : "text-amber-200"}>
                      {item.done ? "✓" : "•"} {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Importar base de cadastro</h2><span className="kpi-chip">XLSX</span></div>
          <form action={`/api/projects/${id}/cadastro/import`} method="post" encType="multipart/form-data" className="flex gap-2 flex-wrap items-center mt-3 text-sm">
            <input type="file" name="file" accept=".xlsx,.xls" required className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 px-3 cursor-pointer">Importar base</button>
          </form>
          <div className="text-xs text-slate-400 mt-2">Formato esperado: aba <b>fornecedores</b> + aba <b>Plano de Contas</b>.</div>
        </section>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Dados mestres e parâmetros financeiros</h2><span className="kpi-chip">setup crítico</span></div>
        {!project ? (
          <div className="alert bad-bg">Projeto não encontrado no banco. Crie em /projetos.</div>
        ) : !allowed ? (
          <div className="alert bad-bg">Sem permissão para este projeto.</div>
        ) : (
          <form action={`/api/projects/${id}/update`} method="post" className="grid md:grid-cols-2 gap-2 text-sm mt-4">
            <label className="space-y-1"><span className="text-slate-400">Nome</span><input name="name" defaultValue={project.name} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">CNPJ</span><input name="cnpj" defaultValue={project.cnpj} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">Razão social</span><input name="legal_name" defaultValue={project.legal_name} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">Segmento</span><input name="segment" defaultValue={project.segment} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">Timezone</span><input name="timezone" defaultValue={project.timezone} className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-slate-400">Resumo do projeto</span><textarea name="project_summary" defaultValue={project.project_summary || ""} className="w-full min-h-24 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" placeholder="Resumo executivo com foco em KPI e risco" /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-slate-400">Sócios (vírgula)</span><input name="partners" defaultValue={(project.partners || []).join(", ")} className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-slate-400">Plano de contas (obrigatório, 1 por linha)</span><textarea name="account_plan" required defaultValue={(project.account_plan || []).join("\n")} className="w-full min-h-32 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">TX (%)</span><input type="number" step="0.01" min="0" name="tx_percent" defaultValue={Number(project.financial_profile?.tx_percent || 0)} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">FLOAT (dias)</span><input type="number" min="0" name="float_days" defaultValue={Number(project.financial_profile?.float_days || 0)} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">TAC (R$)</span><input type="number" step="0.01" min="0" name="tac" defaultValue={Number(project.financial_profile?.tac || 0)} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-slate-400">Custo por boleto (R$)</span><input type="number" step="0.01" min="0" name="cost_per_boleto" defaultValue={Number(project.financial_profile?.cost_per_boleto || 0)} required className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-slate-400">Cadastro de fornecedores</span><textarea name="supplier_classes" defaultValue={(project.supplier_classes || []).map((r) => {
              if (r.type || r.nature || r.subclassification || r.classification || r.movement || r.flow) {
                return [r.supplier, r.type || '', r.nature || '', r.subclassification || '', r.classification || '', r.movement || '', r.flow || ''].join('|');
              }
              return `${r.supplier}|${r.account || ''}`;
            }).join("\n")} className="w-full min-h-32 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" /></label>
            <button className="badge py-2 cursor-pointer md:col-span-2" type="submit">Salvar cadastro</button>
          </form>
        )}

        {project && (project.supplier_classes || []).length > 0 ? (
          <div className="mt-4 table-wrap">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/70">
                <tr>
                  <th className="text-left px-2 py-2 border-b border-slate-800">Razão social / nome</th>
                  <th className="text-left px-2 py-2 border-b border-slate-800">Tipo</th>
                  <th className="text-left px-2 py-2 border-b border-slate-800">Natureza</th>
                  <th className="text-left px-2 py-2 border-b border-slate-800">Subclassificação</th>
                  <th className="text-left px-2 py-2 border-b border-slate-800">Classificação</th>
                  <th className="text-left px-2 py-2 border-b border-slate-800">Movimentação</th>
                  <th className="text-left px-2 py-2 border-b border-slate-800">Fluxo</th>
                </tr>
              </thead>
              <tbody>
                {(project.supplier_classes || []).map((r, i) => (
                  <tr key={`${r.supplier}-${i}`} className="odd:bg-slate-900/30">
                    <td className="px-2 py-1.5 border-b border-slate-900">{r.supplier}</td>
                    <td className="px-2 py-1.5 border-b border-slate-900">{r.type || '-'}</td>
                    <td className="px-2 py-1.5 border-b border-slate-900">{r.nature || '-'}</td>
                    <td className="px-2 py-1.5 border-b border-slate-900">{r.subclassification || '-'}</td>
                    <td className="px-2 py-1.5 border-b border-slate-900">{r.classification || r.account || '-'}</td>
                    <td className="px-2 py-1.5 border-b border-slate-900">{r.movement || '-'}</td>
                    <td className="px-2 py-1.5 border-b border-slate-900">{r.flow || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {query.saved ? <div className="alert ok-bg mt-3">{query.saved === 'import' ? 'Base de cadastro importada com sucesso.' : 'Cadastro salvo com sucesso.'}</div> : null}
        {query.error ? <div className="alert bad-bg mt-3">{query.error === "onboarding_incomplete" ? "Onboarding incompleto. Preencha todo o checklist antes de avançar para as próximas etapas." : "Não foi possível salvar o cadastro agora. Revise os campos obrigatórios e tente novamente."}</div> : null}
      </section>
    </AppShell>
  );
}
