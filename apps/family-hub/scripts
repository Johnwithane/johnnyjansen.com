#!/usr/bin/env node
// The portal from a terminal, or from a Claude Code session on any machine.
//
// Talks to the `me` Cloud Function over HTTPS with YOUR personal token. No
// Google credentials, no firebase-admin, no gcloud. Mint the token once on the
// Household screen (Claude Code access), set it as $ME_TOKEN, and go:
//
//   npm run me today                    calendar + unread + open tasks, fresh from Google
//   npm run me calendar [days]          events for the next N days (default 7)
//   npm run me inbox [max]              newest unread threads (default 15)
//   npm run me tasks [done]             open tasks (or done ones)
//   npm run me add "Call the bank" [--due 2026-09-20] [--notes "..."] [--private]
//   npm run me done <id> | reopen <id> | rm <id>
//   npm run me digest [day]             the stored digest (newest, or YYYY-MM-DD)
//   npm run me digest run               build + store + email today's digest now
//   npm run me feedback [status|all]    the household's bug / idea queue (default open), screenshots downloaded
//   npm run me feedback show <id>       one report in full
//   npm run me feedback triage <id> <open|triaged|in_progress|wontfix> [notes...]
//   npm run me feedback dispatch <id>   open a GitHub issue for it (label: claude)
//   npm run me raw '{"action":"..."}'   any action, verbatim JSON
//
// Every command prints a readable digest to stdout; add --json for the raw
// response (what a script wants).

import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const TOKEN = process.env.ME_TOKEN || "";
const ENDPOINT = process.env.ME_ENDPOINT || "https://us-central1-familyhub-prod.cloudfunctions.net/me";

function die(msg) {
  console.error(msg);
  process.exit(1);
}

async function call(body) {
  if (!TOKEN) die("ME_TOKEN is not set. Mint one on the Household screen and export it.");
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-me-token": TOKEN },
      body: JSON.stringify(body),
    });
  } catch (e) {
    die(`Could not reach ${ENDPOINT}: ${e.message}`);
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    die(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (res.status === 401) die("Unauthorized: this token was revoked or never minted. Mint a new one on the Household screen.");
  if (!res.ok) die(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function flag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

function timeOf(iso, tz) {
  return new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(new Date(iso));
}

function sender(from) {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/);
  return (m && m[1].trim()) || from.trim();
}

function printEvents(events, tz) {
  if (!events.length) return console.log("  Nothing on the calendar.");
  for (const e of events) {
    const when = e.allDay ? "All day" : `${timeOf(e.start, tz)} to ${timeOf(e.end, tz)}`;
    const day = e.allDay ? e.start : e.start.slice(0, 10);
    console.log(`  ${day}  ${when}  ${e.title}${e.location ? ` (${e.location})` : ""}`);
  }
}

function printMail(items, total) {
  if (!items.length) return console.log("  Inbox zero.");
  console.log(`  ${total} unread, newest ${items.length}:`);
  for (const m of items) console.log(`  - ${sender(m.from)}: ${m.subject}\n      ${m.snippet.slice(0, 120)}`);
}

function printTasks(tasks) {
  if (!tasks.length) return console.log("  No tasks.");
  for (const t of tasks) console.log(`  [${t.id}] ${t.title}${t.due ? ` (due ${t.due})` : ""}${t.visibility === "private" ? "  (private)" : ""}`);
}

const SHOT_DIR = process.env.ME_SHOTS || path.join(os.tmpdir(), "me-feedback");

/** Download a report's signed screenshot URLs so a session can Read the images. */
async function pullShots(id, urls) {
  const files = [];
  if (!urls.length) return files;
  const dir = path.join(SHOT_DIR, id);
  await mkdir(dir, { recursive: true });
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i]);
      if (!res.ok) continue;
      const ext = (res.headers.get("content-type") || "image/png").split("/")[1].split(";")[0] || "png";
      const file = path.join(dir, `shot-${i + 1}.${ext}`);
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      files.push(file);
    } catch {
      /* skip a dead URL */
    }
  }
  return files;
}

async function printReport(r, full = false) {
  const shots = await pullShots(r.id, r.screenshots || []);
  console.log(`\n--- [${r.id}] ${r.type} · ${r.status} · ${r.reporterName} · ${(r.createdAt || "").slice(0, 10)}`);
  console.log(`  ${r.description.replace(/\n/g, "\n  ")}`);
  console.log(`  route: ${r.route}${r.githubIssueUrl ? `  issue: ${r.githubIssueUrl}` : ""}`);
  if (r.notes) console.log(`  notes: ${r.notes}`);
  for (const f of shots) console.log(`  screenshot: ${f}`);
  if (full) console.log(`  env:\n    ${(r.environment || "").replace(/\n/g, "\n    ")}`);
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  if (json) args.splice(args.indexOf("--json"), 1);
  const [cmd, ...rest] = args;
  let body;

  switch (cmd) {
    case "today":
      body = { action: "today" };
      break;
    case "calendar":
      body = { action: "calendar", days: rest[0] ? Number(rest[0]) : 7 };
      break;
    case "inbox":
      body = { action: "inbox", max: rest[0] ? Number(rest[0]) : 15 };
      break;
    case "tasks":
      body = { action: "tasks.list", done: rest[0] === "done" };
      break;
    case "add": {
      const due = flag(rest, "--due");
      const notes = flag(rest, "--notes");
      const priv = rest.includes("--private");
      if (priv) rest.splice(rest.indexOf("--private"), 1);
      const title = rest.join(" ").trim();
      if (!title) die('Usage: me add "title" [--due YYYY-MM-DD] [--notes "..."] [--private]');
      body = { action: "tasks.add", title, visibility: priv ? "private" : "household", ...(due ? { due } : {}), ...(notes ? { notes } : {}) };
      break;
    }
    case "done":
    case "reopen":
    case "rm":
      if (!rest[0]) die(`Usage: me ${cmd} <id>`);
      body = { action: cmd === "rm" ? "tasks.delete" : `tasks.${cmd}`, id: rest[0] };
      break;
    case "digest":
      body = rest[0] === "run" ? { action: "digest.run" } : { action: "digest.get", ...(rest[0] ? { day: rest[0] } : {}) };
      break;
    case "feedback": {
      const sub = rest[0];
      if (sub === "show") body = { action: "feedback.get", id: rest[1] };
      else if (sub === "triage") body = { action: "feedback.triage", id: rest[1], status: rest[2], ...(rest.length > 3 ? { notes: rest.slice(3).join(" ") } : {}) };
      else if (sub === "dispatch") body = { action: "feedback.dispatch", id: rest[1] };
      else body = { action: "feedback.list", status: sub || "open" };
      if ((sub === "show" || sub === "triage" || sub === "dispatch") && !rest[1]) die(`Usage: me feedback ${sub} <id> ...`);
      break;
    }
    case "raw":
      try {
        body = JSON.parse(rest.join(" "));
      } catch {
        die("raw takes one JSON object");
      }
      break;
    default:
      die("Commands: today | calendar [days] | inbox [max] | tasks [done] | add | done | reopen | rm | digest [day|run] | feedback [status|show|triage|dispatch] | raw");
  }

  const out = await call(body);
  if (json) return console.log(JSON.stringify(out, null, 2));

  switch (body.action) {
    case "today": {
      console.log(`${out.dayKey} (${out.timeZone})  google: ${out.sources.google}\n`);
      console.log("CALENDAR");
      printEvents(out.events, out.timeZone);
      console.log("\nINBOX");
      printMail(out.unread, out.unreadTotal);
      console.log("\nTASKS");
      printTasks(out.tasks);
      break;
    }
    case "calendar":
      if (out.error) return console.log(out.error);
      console.log(`${out.days} days from ${out.from}`);
      printEvents(out.events, undefined);
      break;
    case "inbox":
      if (out.error) return console.log(out.error);
      printMail(out.items, out.total);
      break;
    case "tasks.list":
      printTasks(out.tasks);
      break;
    case "tasks.add":
    case "tasks.done":
    case "tasks.reopen":
      if (out.error) return console.log(`${out.error}: ${out.id}`);
      console.log(`[${out.task.id}] ${out.task.title}  done=${out.task.done}`);
      break;
    case "tasks.delete":
      console.log(out.error ? `${out.error}: ${out.id}` : `deleted ${out.deleted}`);
      break;
    case "digest.get":
    case "digest.run":
      if (out.error) return console.log(out.error);
      console.log(`${out.subject}\nemailed: ${out.emailed}${out.emailError ? ` (${out.emailError})` : ""}\n\n${out.text}`);
      break;
    case "feedback.list":
      console.log(`${out.reports.length} report(s)`);
      for (const r of out.reports) await printReport(r);
      break;
    case "feedback.get":
      if (out.error) return console.log(`${out.error}: ${out.id}`);
      await printReport(out.report, true);
      break;
    case "feedback.triage":
      console.log(out.error ? `${out.error}: ${out.id}` : `${out.id} -> ${out.status}`);
      break;
    case "feedback.dispatch":
      console.log(out.error ? `${out.error}: ${out.id}` : `issue #${out.issue.number} ${out.issue.url}`);
      break;
    default:
      console.log(JSON.stringify(out, null, 2));
  }
}

main().catch((e) => die(e.message));
