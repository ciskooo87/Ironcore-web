"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";
import { can } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";

function extractProjectCode(pathname: string) {
  const m = pathname.match(/^\/projetos\/([^/]+)/);
  return m?.[1] || "elicon";
}

function resolveHref(template: string, projectCode: string) {
  return template.replace(":id", projectCode);
}

const SECTION_LABEL: Record<string, string> = {
  geral: "Geral",
  projeto: "Ordem de uso",
  governanca: "Governança",
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

  const sections = ["geral", "projeto", "governanca"] as const;

  return (
    <aside className="card h-fit md:sticky md:top-4">
      <div className="space-y-4">
        {sections.map((section) => {
          const items = visible.filter((i) => i.section === section);
          if (items.length === 0) return null;

          return (
            <div key={section}>
              <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">{SECTION_LABEL[section]}</div>
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.hrefResolved || pathname?.startsWith(`${item.hrefResolved}/`);
                  return (
                    <Link
                      key={item.key}
                      href={item.hrefResolved}
                      className={`block rounded-lg px-3 py-2 text-sm border ${active ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200" : "border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-900/60"}`}
                    >
                      {item.label}
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
