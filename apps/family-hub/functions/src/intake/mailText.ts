import type { gmail_v1 } from "googleapis";

// Turn a Gmail message payload into plain text for the model. The text is
// read once and never stored (PLAN.md 4.20): only what the model proposed
// lands in Firestore, plus the sender, subject and message id.

function decode(data?: string | null): string {
  if (!data) return "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/tr>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Prefer a text/plain part; fall back to stripped text/html; cap the length. */
export function extractText(payload: gmail_v1.Schema$MessagePart | undefined, cap = 6000): string {
  if (!payload) return "";
  let plain = "";
  let html = "";
  const walk = (p: gmail_v1.Schema$MessagePart) => {
    const mime = p.mimeType ?? "";
    if (mime === "text/plain" && !plain) plain = decode(p.body?.data);
    else if (mime === "text/html" && !html) html = decode(p.body?.data);
    for (const c of p.parts ?? []) walk(c);
  };
  walk(payload);
  const text = plain.trim() || stripHtml(html);
  return text.slice(0, cap);
}
