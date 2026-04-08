export default function CashflowNewLaunchPage() {
  return (
    <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <h2 className="text-2xl font-semibold text-[#101828]">Novo lançamento</h2>
      <p className="mt-2 text-sm text-[#667085]">Fluxo inicial para registrar entrada ou saída com comprovante.</p>
      <form className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="date" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3" />
        <input placeholder="Descrição" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3" />
        <input placeholder="Valor" type="number" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3" />
        <select className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3"><option>Entrada</option><option>Saída</option></select>
        <input placeholder="Categoria" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3" />
        <input placeholder="Conta" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3" />
        <input type="file" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 md:col-span-2" />
        <textarea placeholder="Observações" className="min-h-28 rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 md:col-span-2" />
        <button type="button" className="rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white md:col-span-2 md:w-fit">Salvar lançamento</button>
      </form>
    </section>
  );
}
