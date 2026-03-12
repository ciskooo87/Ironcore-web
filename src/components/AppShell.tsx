import type { SessionUser } from "@/lib/auth";
import { SidebarNav } from "@/components/SidebarNav";
import { BrandMark } from "@/components/BrandMark";

export function AppShell({ title, subtitle, user, children }: { title: string; subtitle?: string; user: SessionUser; children: React.ReactNode }) {
  return (
    <main className="min-h-screen p-4 md:p-6">
      <header className="card mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <BrandMark compact />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle ? <p className="text-sm text-slate-400 mt-1">{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="pill">{user.name}</span>
            <span className="pill">{user.role}</span>
            <form action="/api/auth/logout" method="post">
              <button className="pill" type="submit">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 items-start">
        <SidebarNav user={user} />
        <section>{children}</section>
      </div>
    </main>
  );
}
