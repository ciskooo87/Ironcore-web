export type ProductStage = "ok" | "atencao" | "bloqueado" | "implantacao";
export type ProductTone = "good" | "warn" | "bad" | "info";

export function productTone(stage: ProductStage): ProductTone {
  if (stage === "bloqueado") return "bad";
  if (stage === "atencao") return "warn";
  if (stage === "implantacao") return "info";
  return "good";
}

export function productStageLabel(stage: ProductStage) {
  if (stage === "bloqueado") return "Bloqueado";
  if (stage === "atencao") return "Atenção";
  if (stage === "implantacao") return "Implantação";
  return "Operação estável";
}

export function productToneClass(tone: ProductTone) {
  if (tone === "bad") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (tone === "warn") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (tone === "info") return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}
