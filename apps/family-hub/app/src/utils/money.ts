import type { Transaction } from "@/firebase/interfaces";

/** "$1,234.50" in the household currency (CAD by default). */
export function money(n: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
}

/** YYYY-MM of a YYYY-MM-DD. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Spend per category for one month, expenses only, transfers excluded. */
export function spendByCategory(txs: Pick<Transaction, "amount" | "direction" | "date" | "category">[], ym: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txs) {
    if (t.direction !== "expense" || monthOf(t.date) !== ym || t.category === "transfer") continue;
    out[t.category] = Math.round(((out[t.category] ?? 0) + t.amount) * 100) / 100;
  }
  return out;
}

export function totalSpend(byCat: Record<string, number>): number {
  return Math.round(Object.values(byCat).reduce((a, b) => a + b, 0) * 100) / 100;
}

/** Shrink an image file to <= maxEdge px JPEG and return base64 (no prefix) plus a Blob for upload. */
export async function shrinkImage(file: File, maxEdge = 1600, quality = 0.85): Promise<{ base64: string; blob: Blob; mimeType: "image/jpeg" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", quality));
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  return { base64: dataUrl.split(",")[1] ?? "", blob, mimeType: "image/jpeg" };
}
