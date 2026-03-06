import * as XLSX from "xlsx";

type ParsedUpload = {
  faturamento: number;
  contas_receber: number;
  contas_pagar: number;
  extrato_bancario: number;
  duplicatas: number;
  lines: number;
};

const MAP: Record<string, keyof ParsedUpload | null> = {
  faturamento: "faturamento",
  contas_receber: "contas_receber",
  contas_pagar: "contas_pagar",
  extrato_bancario: "extrato_bancario",
  duplicatas: "duplicatas",
};

const PDF_HINTS: Record<keyof Omit<ParsedUpload, "lines">, string[]> = {
  faturamento: ["faturamento", "receita", "vendas", "valor faturado"],
  contas_receber: ["contas a receber", "a receber", "recebiveis", "recebíveis"],
  contas_pagar: ["contas a pagar", "a pagar", "fornecedores", "pagamentos"],
  extrato_bancario: ["saldo final", "saldo atual", "extrato", "saldo"],
  duplicatas: ["duplicatas", "titulos", "títulos"],
};

function toNum(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseBrMoney(input: string): number | null {
  const cleaned = input
    .replace(/R\$/gi, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");

  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function extractMonetaryCandidates(line: string): number[] {
  const matches = line.match(/-?\s*R\$?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})|-?\s*\d+(?:[\.,]\d{2})/g) || [];
  const out: number[] = [];
  for (const raw of matches) {
    const n = parseBrMoney(raw);
    if (n !== null) out.push(n);
  }
  return out;
}

function fromRows(rows: Array<Record<string, unknown>>): ParsedUpload {
  const acc: ParsedUpload = {
    faturamento: 0,
    contas_receber: 0,
    contas_pagar: 0,
    extrato_bancario: 0,
    duplicatas: 0,
    lines: rows.length,
  };

  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      const key = MAP[k.trim().toLowerCase()] || null;
      if (key) acc[key] += toNum(v);
    }
  }
  return acc;
}

async function fromPdfBuffer(buf: Buffer): Promise<ParsedUpload> {
  const pdf = (await import("pdf-parse")).default;
  const result = await pdf(buf);
  const text = result.text || "";
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const acc: ParsedUpload = {
    faturamento: 0,
    contas_receber: 0,
    contas_pagar: 0,
    extrato_bancario: 0,
    duplicatas: 0,
    lines: lines.length,
  };

  for (const line of lines) {
    const lower = line.toLowerCase();
    const values = extractMonetaryCandidates(line);
    if (values.length === 0) continue;

    let matched = false;
    for (const [field, hints] of Object.entries(PDF_HINTS) as Array<[keyof Omit<ParsedUpload, "lines">, string[]]>) {
      if (hints.some((h) => lower.includes(h))) {
        acc[field] += values[values.length - 1] || 0;
        matched = true;
        break;
      }
    }

    if (!matched && (lower.includes("saldo") || lower.includes("extrato"))) {
      acc.extrato_bancario += values[values.length - 1] || 0;
    }
  }

  // fallback pragmático: se não achou saldo por heurística, usa soma dos valores do documento
  if (acc.extrato_bancario === 0) {
    let sum = 0;
    for (const line of lines) {
      const vals = extractMonetaryCandidates(line);
      for (const v of vals) sum += v;
    }
    acc.extrato_bancario = sum;
  }

  return acc;
}

export async function parseUploadedFile(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const txt = buf.toString("utf-8");
    const [head, ...lines] = txt.split(/\r?\n/).filter(Boolean);
    const cols = head.split(",").map((s) => s.trim());
    const rows = lines.map((line) => {
      const parts = line.split(",");
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => {
        row[c] = parts[i] ?? "";
      });
      return row;
    });
    return fromRows(rows);
  }

  if (name.endsWith(".pdf")) {
    return fromPdfBuffer(buf);
  }

  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return fromRows(rows);
}
