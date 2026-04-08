export default function CashflowLoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Login demo</div>
      <h2 className="mt-3 text-2xl font-semibold text-[#101828]">Acesso inicial</h2>
      <div className="mt-4 grid gap-3 text-sm text-[#475467]">
        <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Usuário: <strong>admin@ironsaas.local</strong></div>
        <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Senha: <strong>admin123</strong></div>
      </div>
    </section>
  );
}
