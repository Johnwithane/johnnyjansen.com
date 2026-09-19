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
  }),
  z.object({ action: z.literal("tasks.done"), id: z.string().min(1).max(128) }),
  z.object({ action: z.literal("tasks.reopen"), id: z.string().min(1).max(128) }),
  z.object({ action: z.literal("tasks.delete"), id: z.string().min(1).max(128) }),
  /** The stored digest for a day (default: the newest). */
  z.object({ action: z.literal("digest.get"), day: day.optional() }),
  /** Build + store + email today's digest right now. */
  z.object({ action: z.literal("digest.run") }),
]);

export type MeBody = z.infer<typeof MeBody>;
export const ME_ACTIONS = MeBody.options.map((o) => o.shape.action.value);
