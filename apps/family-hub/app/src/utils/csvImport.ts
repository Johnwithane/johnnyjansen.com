import { CATEGORIES, type Category } from "@/data/categories";

// Bank statement CSV → transaction rows (PLAN.md 4.5). Every Canadian bank
// exports one, and they all disagree on columns. Parse in the browser, guess
// the columns, let the person fix the preview, then write through the normal
// service. Nothing here touches Firestore.

export interface ImportRow {
  date: string;
  merchant: string;
  amount: number;
  direction: "expense" | "income";
  category: Category;
}

/** RFC-4180-ish: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** ISO, MM/DD/YYYY (Canadian bank exports), DD/MM/YYYY when the first number cannot be a month, "Sep 18, 2026". Else "". */
export function parseDate(s: string): string {
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    let [mm, dd] = [Number(m[1]), Number(m[2])];
    if (mm > 12 && dd <= 12) [mm, dd] = [dd, mm];
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
    return `${m[3]}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  m = t.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})$/);
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    if (!mm) return "";
    return `${m[3]}-${String(mm).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  return "";
}

export function parseAmount(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const neg = /^\(.*\)$/.test(t) || t.includes("-");
  const n = parseFloat(t.replace(/[^0-9.]/g, ""));
  if (!isFinite(n)) return null;
  return neg ? -n : n;
}

export interface ColumnMap {
  date: number;
  merchant: number;
  /** One signed amount column, or -1. */
  amount: number;
  /** Separate debit / credit columns, or -1. */
  debit: number;
  credit: number;
  hasHeader: boolean;
}

/** Guess which column is which from a header row, else from the data itself (TD exports have no header). */
export function detectColumns(rows: string[][]): ColumnMap | null {
  if (!rows.length) return null;
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const find = (...names: string[]) => head.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  const byHeader: ColumnMap = { date: find("date"), merchant: find("description", "merchant", "payee", "name", "details", "memo"), amount: find("amount", "cad$"), debit: find("debit", "withdrawal", "money out"), credit: find("credit", "deposit", "money in"), hasHeader: true };
  if (byHeader.date >= 0 && byHeader.merchant >= 0 && (byHeader.amount >= 0 || byHeader.debit >= 0 || byHeader.credit >= 0)) {
    if (byHeader.amount >= 0 && byHeader.amount === byHeader.debit) byHeader.debit = -1;
    return byHeader;
  }
  // No usable header: the first data row decides. Date is the first column that parses as one,
  // merchant the longest text column, numbers fill amount (one) or debit + credit (two).
  const sample = rows.slice(0, 5);
  const cols = rows[0].length;
  const dateCol = Array.from({ length: cols }, (_, i) => i).find((i) => sample.every((r) => parseDate(r[i] ?? "") !== ""));
  if (dateCol === undefined) return null;
  const numeric = Array.from({ length: cols }, (_, i) => i).filter((i) => i !== dateCol && sample.every((r) => (r[i] ?? "").trim() === "" || parseAmount(r[i] ?? "") !== null) && sample.some((r) => parseAmount(r[i] ?? "") !== null));
  const textCols = Array.from({ length: cols }, (_, i) => i).filter((i) => i !== dateCol && !numeric.includes(i));
  const merchant = textCols.sort((a, b) => sample.reduce((s, r) => s + (r[b] ?? "").length, 0) - sample.reduce((s, r) => s + (r[a] ?? "").length, 0))[0];
  if (merchant === undefined || !numeric.length) return null;
  if (numeric.length === 1) return { date: dateCol, merchant, amount: numeric[0], debit: -1, credit: -1, hasHeader: false };
  // Two or more numeric columns: debit, credit, (balance). Balance is the one that is never blank.
  const blanky = numeric.filter((i) => sample.some((r) => (r[i] ?? "").trim() === ""));
  const [debit, credit] = blanky.length >= 2 ? blanky : numeric;
  return { date: dateCol, merchant, amount: -1, debit, credit, hasHeader: false };
}

const KEYWORDS: [Category, RegExp][] = [
  ["groceries", /save.?on|superstore|safeway|costco|walmart|no frills|sobeys|loblaw|iga|thrifty|farm|market|grocery|whole foods|t&t/i],
  ["eating_out", /tim hortons|starbucks|mcdonald|subway|pizza|restaurant|cafe|coffee|doordash|skip|uber eats|a&w|wendy|burger|sushi|bistro|pub|grill|taco/i],
  ["utilities", /hydro|fortis|telus|rogers|shaw|bell|fido|koodo|freedom|water|gas bill|internet|enbridge/i],
  ["subscriptions", /netflix|spotify|disney|apple\.com|icloud|google|amazon prime|youtube|crave|patreon|adobe|microsoft|dropbox|openai|anthropic/i],
  ["car", /petro|shell|esso|chevron|husky|co-op gas|parking|icbc|canadian tire|jiffy|kal tire|mr\. lube|toyota|honda|ford/i],
  ["health", /pharma|shoppers|london drugs|dental|dentist|physio|clinic|optical|rexall|massage|chiro/i],
  ["kids", /daycare|school|camp|swim|gymnastics|toys|lego|indigo|scholastic|hockey|soccer|dance/i],
  ["home", /home depot|rona|ikea|lowe|wayfair|home hardware|cleaning|furniture/i],
  ["clothing", /old navy|gap|h&m|zara|lululemon|winners|marshalls|mec|sport chek|aritzia|uniqlo|shoe/i],
  ["fun", /cinema|cineplex|theatre|steam|nintendo|playstation|xbox|ticket|concert|golf|ski/i],
  ["travel", /air canada|westjet|flair|hotel|airbnb|expedia|booking\.com|via rail|bc ferries/i],
  ["transfer", /e-transfer|etransfer|transfer|payment - thank you|pymt|credit card payment/i],
  ["income", /payroll|salary|deposit|refund|cra |canada child|ccb|gst credit/i],
];

export function guessCategory(merchant: string, direction: "expense" | "income"): Category {
  for (const [c, re] of KEYWORDS) if (re.test(merchant)) return c;
  return direction === "income" ? "income" : "other";
}

/** Map parsed rows through the column guess. Rows without a date or an amount are dropped. */
export function rowsToImport(rows: string[][], map: ColumnMap): ImportRow[] {
  const data = map.hasHeader ? rows.slice(1) : rows;
  const out: ImportRow[] = [];
  for (const r of data) {
    const date = parseDate(r[map.date] ?? "");
    const merchant = (r[map.merchant] ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    let signed: number | null = null;
    if (map.amount >= 0) signed = parseAmount(r[map.amount] ?? "");
    else {
      const d = map.debit >= 0 ? parseAmount(r[map.debit] ?? "") : null;
      const c = map.credit >= 0 ? parseAmount(r[map.credit] ?? "") : null;
      signed = d !== null && d !== 0 ? -Math.abs(d) : c !== null && c !== 0 ? Math.abs(c) : null;
    }
    if (!date || !merchant || signed === null || signed === 0) continue;
    const direction = signed < 0 ? "expense" : "income";
    out.push({ date, merchant, amount: Math.round(Math.abs(signed) * 100) / 100, direction, category: guessCategory(merchant, direction) });
  }
  return out;
}

/** Same day, same amount, same merchant key = the same transaction. */
export function importKey(t: { date: string; amount: number; merchant: string }): string {
  return `${t.date}|${t.amount.toFixed(2)}|${t.merchant.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16)}`;
}

export function isCategory(s: string): s is Category {
  return (CATEGORIES as readonly string[]).includes(s);
}
