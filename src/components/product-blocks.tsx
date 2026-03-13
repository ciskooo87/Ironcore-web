import type { ReactNode } from "react";

export function CommandPanel({
  title = "Próxima ação",
  action,
  risk,
}: {
  title?: string;
  action: ReactNode;
  risk: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="mt-2 text-lg font-semibold text-white">{action}</div>
      <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
      <div className="mt-2 text-sm text-slate-300">{risk}</div>
    </div>
  );
}

export function CheckpointPanel({
  title = "Checkpoint",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
