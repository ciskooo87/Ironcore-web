"use client";

export function PrintButton({ label = "Exportar / Imprimir PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="badge py-2 px-3 cursor-pointer"
    >
      {label}
    </button>
  );
}
