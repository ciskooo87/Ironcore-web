import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
  showWordmark?: boolean;
};

export function BrandMark({ compact = false, href = "/dashboard", showWordmark = false }: BrandMarkProps) {
  const content = (
    <div className={`flex items-center gap-2 ${compact ? "" : "min-w-0"}`}>
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${compact ? "h-11 w-11" : "h-12 w-12"}`}>
        <img
          src="/brand/ironcore-symbol.png"
          alt="Ironcore"
          className="h-full w-full object-cover"
        />
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">IRONCORE</div>
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href} className="inline-flex">{content}</Link> : content;
}
