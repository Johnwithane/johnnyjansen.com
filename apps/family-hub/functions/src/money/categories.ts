// The family's spending categories and how they roll up to Canadian tax
// lines. Mirrored in app/src/data/categories.ts; keep in step. The prompt
// quotes these ids, so the model can only answer inside this vocabulary.

export const CATEGORIES = [
  "groceries",
  "eating_out",
  "home",
  "utilities",
  "kids",
  "car",
  "health",
  "clothing",
  "fun",
  "travel",
  "gifts",
  "subscriptions",
  "business",
  "income",
  "transfer",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Tax-relevant buckets, distinct from spending categories (a pharmacy receipt is health AND medical). */
export const TAX_CATEGORIES = ["none", "medical", "childcare", "donation", "home_office", "vehicle", "union_dues", "moving", "tuition"] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

/** CRA line the tax category rolls up to, for the Taxes screen. */
export const TAX_LINES: Record<Exclude<TaxCategory, "none">, { line: string; label: string }> = {
  medical: { line: "33099", label: "Medical expenses" },
  childcare: { line: "21400", label: "Child care expenses" },
  donation: { line: "34900", label: "Donations and gifts" },
  home_office: { line: "22900", label: "Other employment expenses (home office)" },
  vehicle: { line: "22900", label: "Other employment expenses (vehicle)" },
  union_dues: { line: "21200", label: "Union and professional dues" },
  moving: { line: "21900", label: "Moving expenses" },
  tuition: { line: "32300", label: "Tuition" },
};

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}
export function isTaxCategory(v: unknown): v is TaxCategory {
  return typeof v === "string" && (TAX_CATEGORIES as readonly string[]).includes(v);
}
