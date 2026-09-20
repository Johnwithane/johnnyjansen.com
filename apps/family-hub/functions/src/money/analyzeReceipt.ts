import { onCall, HttpsError } from "firebase-functions/v2/https";
import { errMeta } from "../lib/log";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { db } from "../lib/admin";
import { callOpts } from "../lib/callOpts";
import { enforceHouseholdCap } from "../lib/rateLimit";
import { requireMfaAdult } from "../lib/tenant";
import { dayKey } from "../lib/dates";
import { generateJson } from "../lib/vertex";
import { CATEGORIES, TAX_CATEGORIES, isCategory, isTaxCategory } from "./categories";

// Snap a receipt, get a transaction proposal back. NO writes: the client
// shows the result, the person confirms, the normal service writes the
// transaction under the rules. Capped per household per day. Adults with a
// second factor only, like every Money path.

const Input = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  dataBase64: z.string().min(100).max(8_000_000), // ~6MB
  /** Business names, so the model can guess which one a receipt belongs to. */
  businesses: z.array(z.string().max(80)).max(10).default([]),
});

const nstr = z.preprocess((v) => (typeof v === "string" ? v : ""), z.string());
const nnum = z.preprocess((v) => {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : 0;
  }
  return 0;
}, z.number());

const Extracted = z.object({
  merchant: nstr,
  date: nstr,
  currency: nstr,
  total: nnum,
  tax: nnum,
  category: nstr,
  taxCategory: nstr,
  business: nstr,
  confidence: nstr,
  // LAST so a truncated response still parses.
  lines: z.preprocess((v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []), z.array(z.object({ label: nstr, amount: nnum }))),
});

const isoDate = (s: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

function prompt(today: string, businesses: string[]): string {
  return [
    "You read ONE RECEIPT or bill (image or PDF) for a family's bookkeeping.",
    "Return ONLY compact minified JSON of exactly this shape:",
    '{"merchant":string,"date":"YYYY-MM-DD","currency":string,"total":number,"tax":number,"category":string,"taxCategory":string,"business":string,"confidence":"sure|likely|unsure","lines":[{"label":string,"amount":number}]}',
    `- Today is ${today}. Read the date printed on the receipt. If only month and day are shown, use the most recent past year. Unknown: "".`,
    "- total = the amount PAID, a positive number in major units, no symbols. tax = GST/HST/PST total if shown, else 0.",
    `- category MUST be one of: ${CATEGORIES.join(", ")}. Grocery stores -> groceries; restaurants, cafes, takeout -> eating_out; fuel, parking, repairs, insurance -> car; pharmacy, dentist, doctor -> health; hardware, furniture, cleaning -> home; hydro, gas, internet, phone -> utilities; toys, school, activities, daycare -> kids.`,
    `- taxCategory MUST be one of: ${TAX_CATEGORIES.join(", ")}. Pharmacy prescriptions, dental, physio, glasses -> medical; daycare, camps, sitters -> childcare; charities -> donation; otherwise none.`,
    businesses.length ? `- business: if the receipt looks like a business expense for one of these, name it exactly, else "": ${businesses.join(" | ")}.` : '- business: "".',
    "- lines: up to 30 item lines, label and amount, if legible; else [].",
    "- confidence: sure if merchant, date and total are all clearly printed; likely if one is inferred; unsure otherwise.",
    '- Use "" or 0 for anything you cannot read. Never invent a total.',
  ].join("\n");
}

export const analyzeReceipt = onCall(callOpts({ timeoutSeconds: 90 }), async (request) => {
  const caller = requireMfaAdult(request);
  const parsed = Input.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Send a JPEG, PNG, WebP or PDF under 6MB.");
  const hh = (await db.collection("households").doc(caller.hid).get()).data() as { limits?: { aiCallsPerDay?: number }; timeZone?: string } | undefined;
  const today = dayKey(new Date(), hh?.timeZone || "America/Vancouver");
  await enforceHouseholdCap(caller.hid, "receipt", hh?.limits?.aiCallsPerDay ?? 20, { today });
  const ctx = { fn: "analyzeReceipt", uid: caller.uid, hid: caller.hid, mimeType: parsed.data.mimeType };
  let data: z.infer<typeof Extracted>;
  try {
    const out = await generateJson([{ inlineData: { mimeType: parsed.data.mimeType, data: parsed.data.dataBase64 } }, { text: prompt(today, parsed.data.businesses) }]);
    data = Extracted.parse(out);
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    throw new HttpsError("unavailable", "Could not read that receipt. Try a clearer photo.");
  }
  logger.info("ok", { ...ctx, confidence: data.confidence, category: data.category });
  return {
    merchant: data.merchant.slice(0, 120),
    date: isoDate(data.date),
    currency: data.currency.slice(0, 3).toUpperCase() || "CAD",
    total: Math.round(Math.abs(data.total) * 100) / 100,
    tax: Math.round(Math.abs(data.tax) * 100) / 100,
    category: isCategory(data.category) ? data.category : "other",
    taxCategory: isTaxCategory(data.taxCategory) ? data.taxCategory : "none",
    business: parsed.data.businesses.includes(data.business) ? data.business : "",
    confidence: ["sure", "likely", "unsure"].includes(data.confidence) ? data.confidence : "unsure",
    lines: data.lines.slice(0, 30).map((l) => ({ label: l.label.slice(0, 80), amount: Math.round(l.amount * 100) / 100 })),
  };
});
