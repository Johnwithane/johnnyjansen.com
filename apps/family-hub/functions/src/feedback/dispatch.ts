import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin";
import { FEEDBACK_REPO } from "../lib/brand";

// Turn a report into a GitHub issue on this repo, labelled `claude`, so the
// work leaves the queue and enters the place it gets done. Called from the
// `me` endpoint (feedback.dispatch). The token is a fine-grained PAT with
// issues:write on the one repo; it ships as "unset" until HUMANTASKS sets it.

export const GITHUB_FEEDBACK_TOKEN = defineSecret("GITHUB_FEEDBACK_TOKEN");
export const GITHUB_REPO = process.env.GITHUB_FEEDBACK_REPO ?? FEEDBACK_REPO;

export interface ReportForIssue {
  reportId: string;
  type: string;
  description: string;
  route: string;
  environment: string;
  appVersion: string;
  notes: string;
  reporterName: string;
}

export function issueBody(r: ReportForIssue): string {
  return [
    `**${r.type}** reported by ${r.reporterName} on \`${r.route || "/"}\` (build ${r.appVersion || "?"})`,
    "",
    r.description,
    "",
    r.notes ? `Triage notes: ${r.notes}\n` : "",
    "<details><summary>Environment</summary>\n\n```\n" + r.environment + "\n```\n</details>",
    "",
    `Close this by shipping a commit with the trailer \`Feedback-Id: ${r.reportId}\`.`,
  ].join("\n");
}

export async function dispatchToGitHub(hid: string, reportId: string): Promise<{ number: number; url: string }> {
  const token = GITHUB_FEEDBACK_TOKEN.value();
  if (!token || token === "unset") throw new Error("GITHUB_FEEDBACK_TOKEN is not set");
  const ref = db.collection("households").doc(hid).collection("feedback").doc(reportId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("not_found");
  const d = snap.data() as Record<string, unknown>;
  if (typeof d.githubIssueNumber === "number") {
    return { number: d.githubIssueNumber, url: String(d.githubIssueUrl ?? "") };
  }
  const r: ReportForIssue = {
    reportId,
    type: String(d.type ?? "bug"),
    description: String(d.description ?? ""),
    route: String(d.route ?? ""),
    environment: String(d.environment ?? ""),
    appVersion: String(d.appVersion ?? ""),
    notes: String(d.notes ?? ""),
    reporterName: String(d.reporterName ?? ""),
  };
  const title = `${r.type}: ${r.description.split("\n")[0].slice(0, 100)}`;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "familyhub-feedback" },
    body: JSON.stringify({ title, body: issueBody(r), labels: ["feedback", r.type, "claude"] }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const issue = (await res.json()) as { number: number; html_url: string };
  await ref.update({
    githubIssueNumber: issue.number,
    githubIssueUrl: issue.html_url,
    dispatchedAt: FieldValue.serverTimestamp(),
    status: "in_progress",
    updatedAt: FieldValue.serverTimestamp(),
  });
  logger.info("dispatched", { hid, reportId, issue: issue.number });
  return { number: issue.number, url: issue.html_url };
}
