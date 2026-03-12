import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
};

export function BrandMark({ compact = false, href = "/dashboard" }: BrandMarkProps) {
  const content = (
    <div className={`flex items-center gap-3 ${compact ? "" : "min-w-0"}`}>
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${compact ? "h-12 w-12" : "h-14 w-14"}`}>
        <Image
          src={compact ? "/brand/ironcore-symbol.png" : "/brand/ironcore-logo.jpg"}
          alt="Ironcore"
          fill
          sizes={compact ? "48px" : "56px"}
          className="object-cover"
          priority
        />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Ironcore</div>
          <div className="text-sm text-slate-400">Sistema operacional de execução financeira</div>
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href} className="inline-flex">{content}</Link> : content;
}
