import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
  showWordmark?: boolean;
};

export function BrandMark({ compact = false, href = "/dashboard", showWordmark = false }: BrandMarkProps) {
  const content = (
    <div className={`flex items-center ${showWordmark ? "justify-center text-center w-full" : ""} gap-3 ${compact ? "" : "min-w-0"}`}>
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${compact ? (showWordmark ? "h-14 w-14" : "h-11 w-11") : "h-12 w-12"}`}>
        <img
          src={compact ? "/brand/ironcore-symbol.png?v=2" : "/brand/ironcore-logo-v2.jpg?v=2"}
          alt="Ironcore"
          className="h-full w-full object-cover"
        />
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <div className="text-[12px] uppercase tracking-[0.28em] text-cyan-300">IRONCORE</div>
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href} className="inline-flex">{content}</Link> : content;
}
