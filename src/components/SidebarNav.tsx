"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, type NavSection } from "@/lib/navigation";
import { can } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";

function extractProjectCode(pathname: string) {
  const m = pathname.match(/^\/projetos\/([^/]+)/);
  return m?.[1] || "elicon";
}

function resolveHref(template: string, projectCode: string) {
  return template.replace(":id", projectCode);
}

const SECTION_META: Record<NavSection, { label: string; helper: string }> = {
  home: {
    label: "Hoje",
    helper: "Centro de comando e carteira",
  },
  operacao: {
    label: "Operação",
    helper: "O que destrava o dia",
  },
  financeiro: {
    label: "Financeiro",
    helper: "Leitura e fechamento",
  },
  implantacao: {
    label: "Implantação",
    helper: "Base estrutural do projeto",
  },
  governanca: {
    label: "Governança",
    helper: "Diretoria, auditoria e status",
  },
};

export function SidebarNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const projectCode = extractProjectCode(pathname || "");

  const visible = NAV_ITEMS
    .filter((item) => !item.action || can(user.role, item.action))
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      ...item,
      hrefResolved: item.projectScoped ? resolveHref(item.href, projectCode) : item.href,
    }));

  const sections: NavSection[] = ["home", "operacao", "financeiro", "implantacao", "governanca"];

  return (
    <aside className="card h-fit md:sticky md:top-4">
      <div className="mb-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-3">
        <BrandMark compact showWordmark />
        <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-300 mt-3">navegação do produto</div>
        <div className="mt-1 text-sm text-slate-300">Organizada por missão, não por ordem histórica de módulo.</div>
      </div>

      <div className="space-y-5">
        {sections.map((section) => {
          const items = visible.filter((i) => i.section === section);
          if (items.length === 0) return null;

          return (
            <div key={section}>
              <div className="mb-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{SECTION_META[section].label}</div>
                <div className="text-xs text-slate-500 mt-1">{SECTION_META[section].helper}</div>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => {
                  const active = pathname === item.hrefResolved || pathname?.startsWith(`${item.hrefResolved}/`);
                  return (
                    <Link
                      key={item.key}
                      href={item.hrefResolved}
                      className={`block rounded-xl border px-3 py-2.5 text-sm transition ${active ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200" : "border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-900/60"}`}
                    >
                      <div className="font-medium leading-tight">{item.label}</div>
                      {item.description ? <div className={`mt-1 text-xs ${active ? "text-cyan-200/80" : "text-slate-500"}`}>{item.description}</div> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
