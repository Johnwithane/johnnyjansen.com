import { z } from "zod";

// The request contract for the `me` endpoint. Kept in its own file so the CLI
// and the tests can describe exactly what the endpoint accepts without
// loading firebase-admin.

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const MeBody = z.discriminatedUnion("action", [
  /** Calendar + unread + open tasks for today, fresh from Google. Also refreshes snapshots/today. */
  z.object({ action: z.literal("today") }),
  /** Calendar for the next N days (default 7). */
  z.object({ action: z.literal("calendar"), days: z.number().int().min(1).max(31).default(7) }),
  /** Newest unread inbox threads. */
  z.object({ action: z.literal("inbox"), max: z.number().int().min(1).max(50).default(15) }),
  z.object({ action: z.literal("tasks.list"), done: z.boolean().default(false) }),
  z.object({
    action: z.literal("tasks.add"),
    title: z.string().trim().min(1).max(500),
    due: day.optional(),
    notes: z.string().max(4000).optional(),
    visibility: z.enum(["household", "private"]).default("household"),
  }),
  z.object({ action: z.literal("tasks.done"), id: z.string().min(1).max(128) }),
  z.object({ action: z.literal("tasks.reopen"), id: z.string().min(1).max(128) }),
  z.object({ action: z.literal("tasks.delete"), id: z.string().min(1).max(128) }),
  /** The stored digest for a day (default: the newest). */
  z.object({ action: z.literal("digest.get"), day: day.optional() }),
  /** Build + store + email today's digest right now. */
  z.object({ action: z.literal("digest.run") }),
  /** The household's feedback queue, screenshots as one-hour signed URLs. */
  z.object({ action: z.literal("feedback.list"), status: z.enum(["open", "triaged", "in_progress", "shipped", "wontfix", "all"]).default("open") }),
  z.object({ action: z.literal("feedback.get"), id: z.string().min(1).max(128) }),
  z.object({
    action: z.literal("feedback.triage"),
    id: z.string().min(1).max(128),
    status: z.enum(["open", "triaged", "in_progress", "wontfix"]),
    notes: z.string().max(2000).optional(),
  }),
  /** Open a GitHub issue for a report (adults). */
  z.object({ action: z.literal("feedback.dispatch"), id: z.string().min(1).max(128) }),
  /** The household calendar for the next N days (default 7). */
  z.object({ action: z.literal("events.list"), days: z.number().int().min(1).max(60).default(7) }),
  z.object({
    action: z.literal("events.add"),
    title: z.string().trim().min(1).max(200),
    /** YYYY-MM-DD, or YYYY-MM-DDTHH:mm in the household's wall clock. */
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/).optional(),
    kind: z.enum(["event", "bill", "birthday", "renewal", "trip", "school"]).default("event"),
    location: z.string().max(300).optional(),
    notes: z.string().max(2000).optional(),
  }),
  z.object({ action: z.literal("events.delete"), id: z.string().min(1).max(128) }),
  /** Pending suggestions this person can see. */
  z.object({ action: z.literal("suggestions.list") }),
  z.object({ action: z.literal("suggestions.dismiss"), id: z.string().min(1).max(128) }),
]);

export type MeBody = z.infer<typeof MeBody>;
export const ME_ACTIONS = MeBody.options.map((o) => o.shape.action.value);
