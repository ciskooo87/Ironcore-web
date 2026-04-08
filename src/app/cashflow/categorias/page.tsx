const categories = [
  ["Recebimentos", "Operacional", "Entrada"],
  ["Fornecedores", "Operacional", "Saída"],
  ["Capex", "Investimento", "Saída"],
  ["Empréstimos", "Financiamento", "Entrada"],
] as const;

export default function CashflowCategoriesPage() {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#98A2B3]">
            <th className="border-b border-black/5 px-3 py-3">Nome</th>
            <th className="border-b border-black/5 px-3 py-3">Grupo</th>
            <th className="border-b border-black/5 px-3 py-3">Direção</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(([name, group, direction]) => (
            <tr key={name}>
              <td className="border-b border-black/5 px-3 py-3 text-[#101828]">{name}</td>
              <td className="border-b border-black/5 px-3 py-3 text-[#475467]">{group}</td>
              <td className="border-b border-black/5 px-3 py-3 text-[#475467]">{direction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
