import { AppShell } from "@/components/AppShell";
import { ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listDailyEntries } from "@/lib/daily";
import { todayInSaoPauloISO } from "@/lib/time";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);
  const query = await searchParams;

  if (!project) {
    return <AppShell user={user} title="Projeto · Painel Diário"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  }

  const allowed = await canAccessProject(user, project.id);
  if (!allowed) {
    return <AppShell user={user} title="Projeto · Painel Diário"><div className="alert bad-bg">Sem permissão para este projeto.</div></AppShell>;
  }

  const entries = await listDailyEntries(project.id, 30);
  const uploads = entries.filter((e) => e.source_type === "upload").length;
  const manuals = entries.filter((e) => e.source_type === "manual").length;
  const latest = entries[0];
  const latestPayload = (latest?.payload || {}) as Record<string, unknown>;
  const mainAction = latest ? 'Revisar os lançamentos mais recentes e completar qualquer base pendente do dia.' : 'Registrar ou subir a primeira base diária para abrir a trilha operacional.';
  const mainRisk = entries.length === 0 ? 'Sem base diária registrada ainda; o resto da operação fica cego.' : `Última base em ${latest?.business_date} via ${latest?.source_type}.`;

  return (
    <AppShell user={user} title="Projeto · Painel Diário" subtitle="Entrada operacional do dia para alimentar rotina, risco, caixa e fechamento sem perder rastreabilidade">
      <ProductHero
        eyebrow="base operacional"
        title="Painel diário precisa ser porta de entrada limpa para o dado, não só formulário solto."
        description="A tela agora organiza lançamento manual, uploads do dia, bases históricas e trilha recente numa leitura mais útil para operação."
      >
        <StatusPill label={`Entradas: ${entries.length}`} tone={entries.length > 0 ? "good" : "warn"} />
        <StatusPill label={`Uploads / manuais: ${uploads} / ${manuals}`} tone="info" />
      </ProductHero>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando do diário</h2><span className="kpi-chip">prioridade operacional</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
              <div className="mt-2 text-lg font-semibold text-white">{mainAction}</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
              <div className="mt-2 text-sm text-slate-300">{mainRisk}</div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Checkpoint</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Última data</div><div className="mt-1 font-medium text-white">{latest?.business_date || '-'}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Origem</div><div className="mt-1 font-medium text-white">{latest?.source_type || '-'}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Faturamento</div><div className="mt-1 font-medium text-white">{Number(latestPayload.faturamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Contas a pagar</div><div className="mt-1 font-medium text-white">{Number(latestPayload.contas_pagar || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <h2 className="title">Lançar movimento diário (manual)</h2>
        <form action={`/api/projects/${id}/daily/create`} method="post" encType="multipart/form-data" className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
          <input name="business_date" type="date" defaultValue={todayInSaoPauloISO()} required className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <select name="source_type" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="manual">manual</option>
            <option value="upload">upload</option>
          </select>
          <input name="faturamento" type="number" step="0.01" placeholder="faturamento" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="contas_receber" type="number" step="0.01" placeholder="contas a receber" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="contas_pagar" type="number" step="0.01" placeholder="contas a pagar" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="extrato_bancario" type="number" step="0.01" placeholder="extrato bancário" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="duplicatas" type="number" step="0.01" placeholder="duplicatas" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="notes" placeholder="observações" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="file" type="file" accept=".csv,.xlsx,.xls" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <button type="submit" className="badge py-2 cursor-pointer">Salvar dia</button>
        </form>

        {query.saved ? <div className="alert ok-bg mt-3">Movimento salvo.</div> : null}
        {query.error ? <div className="alert bad-bg mt-3">Erro: {query.error}.</div> : null}
      </section>

      <section className="card mb-4">
        <h2 className="title">Enviar bases diárias direto pela plataforma</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
          <form action={`/api/projects/${id}/daily/upload`} method="post" encType="multipart/form-data" className="card !p-3">
            <div className="font-medium mb-2">Upload Base Diária</div>
            <input type="hidden" name="upload_kind" value="base_diaria" />
            <input name="business_date" type="date" defaultValue={todayInSaoPauloISO()} required className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="file" type="file" accept=".csv,.xlsx,.xls" required className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="notes" placeholder="observações" className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 cursor-pointer">Enviar base diária</button>
          </form>

          <form action={`/api/projects/${id}/daily/upload`} method="post" encType="multipart/form-data" className="card !p-3">
            <div className="font-medium mb-2">Upload Extrato Bancário</div>
            <input type="hidden" name="upload_kind" value="extrato" />
            <input name="business_date" type="date" defaultValue={todayInSaoPauloISO()} required className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="file" type="file" accept=".csv,.xlsx,.xls" required className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="notes" placeholder="observações" className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 cursor-pointer">Enviar extrato</button>
          </form>
        </div>
      </section>

      <section className="card mb-4">
        <h2 className="title">Upload base histórica e retorno FIDC</h2>
        <p className="text-sm text-slate-400 mt-1">Use esta área para colocar em prática as colunas da planilha ligadas à implementação e ao painel de risco.</p>
        <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
          {[
            ["historico_faturamento", "Histórico · Faturamento"],
            ["historico_contas_pagar", "Histórico · Contas a Pagar"],
            ["historico_contas_receber", "Histórico · Contas a Receber"],
            ["historico_extratos", "Histórico · Extratos"],
            ["historico_estoques", "Histórico · Estoques"],
            ["historico_carteira", "Histórico · Carteira de Pedidos"],
            ["historico_borderos", "Histórico · Borderôs"],
            ["historico_endividamento", "Histórico · Endividamento"],
            ["fidc_retorno", "Operação diária · Retorno FIDC"],
          ].map(([kind, label]) => (
            <form key={kind} action={`/api/projects/${id}/daily/upload`} method="post" encType="multipart/form-data" className="card !p-3">
              <div className="font-medium mb-2">{label}</div>
              <input type="hidden" name="upload_kind" value={kind} />
              <input name="business_date" type="date" defaultValue={todayInSaoPauloISO()} required className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
              <input name="file" type="file" accept=".csv,.xlsx,.xls,.pdf" required className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
              <input name="notes" placeholder="observações / origem / responsável" className="mb-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
              <button type="submit" className="badge py-2 cursor-pointer">Enviar</button>
            </form>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="title">Últimos lançamentos</h2>
        <div className="mt-3 space-y-2 text-sm">
          {entries.length === 0 ? <div className="alert muted-bg">Sem lançamentos ainda. Comece com um lançamento manual ou envie a primeira base do dia para abrir a trilha operacional.</div> : null}
          {entries.map((e) => {
            const p = e.payload as Record<string, unknown>;
            return (
              <form key={e.id} action={`/api/projects/${id}/daily/${e.id}/update`} method="post" className="card !p-3">
                <div className="text-xs text-slate-400 mb-2">{e.business_date} · {e.source_type}</div>
                <div className="grid md:grid-cols-3 gap-2">
                  <input name="faturamento" type="number" step="0.01" defaultValue={Number(p.faturamento || 0)} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
                  <input name="contas_receber" type="number" step="0.01" defaultValue={Number(p.contas_receber || 0)} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
                  <input name="contas_pagar" type="number" step="0.01" defaultValue={Number(p.contas_pagar || 0)} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
                  <input name="extrato_bancario" type="number" step="0.01" defaultValue={Number(p.extrato_bancario || 0)} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
                  <input name="duplicatas" type="number" step="0.01" defaultValue={Number(p.duplicatas || 0)} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
                  <input name="notes" defaultValue={String(p.notes || "")} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
                </div>
                <div className="mt-2">
                  <button className="pill" type="submit">Atualizar lançamento</button>
                </div>
              </form>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
