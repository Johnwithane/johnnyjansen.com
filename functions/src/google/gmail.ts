import type { gmail_v1 } from "googleapis";
import type { MailItem } from "../types";

function header(msg: gmail_v1.Schema$Message, name: string): string {
  const h = msg.payload?.headers?.find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

/**
 * Unread threads in the inbox (newest first), trimmed to sender / subject /
 * snippet. `total` is Gmail's own estimate for the whole query, so the digest
 * can say "23 unread, here are the newest 15" honestly.
 */
export async function listUnread(
  gmail: gmail_v1.Gmail,
  max = 15,
): Promise<{ items: MailItem[]; total: number }> {
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread in:inbox -category:promotions -category:social",
    maxResults: max,
  });
  const ids = res.data.messages ?? [];
  const total = res.data.resultSizeEstimate ?? ids.length;
  const items: MailItem[] = [];
  for (const m of ids) {
    if (!m.id) continue;
    const full = await gmail.users.messages.get({
      userId: "me",
      id: m.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const msg = full.data;
    const dateMs = Number(msg.internalDate ?? 0);
    items.push({
      id: msg.id ?? m.id,
      threadId: msg.threadId ?? m.threadId ?? "",
      from: header(msg, "From"),
      subject: header(msg, "Subject") || "(no subject)",
      snippet: msg.snippet ?? "",
      date: dateMs ? new Date(dateMs).toISOString() : "",
    });
  }
  return { items, total };
}

function base64url(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send an HTML email from the account itself. Used for the daily digest so
 * there is no third-party sender to set up; it lands in Sent like any other
 * message. The plain-text part is what a phone notification previews.
 */
export async function sendEmail(
  gmail: gmail_v1.Gmail,
  input: { to: string; subject: string; text: string; html: string },
): Promise<string> {
  const boundary = `b${Date.now().toString(36)}`;
  const raw = [
    `To: ${input.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.text, "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.html, "utf8").toString("base64"),
    `--${boundary}--`,
  ].join("\r\n");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: base64url(raw) },
  });
  return res.data.id ?? "";
}
