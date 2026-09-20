import { onRequest, type Request } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { FieldValue } from "firebase-admin/firestore";
import { timingSafeEqual } from "node:crypto";
import type { Response } from "express";
import { z } from "zod";
import { db } from "../lib/admin";

// The last step of the feedback loop: CI tells us which reports just went
// live. Only this sets status "shipped", because a fix an adult ticked in a
// dialog is a fix written, and this is a fix running in production.
//
// Reports are addressed by id alone because CI does not know households;
// a collection-group lookup finds the one document with that id.

const CI_FEEDBACK_TOKEN = defineSecret("CI_FEEDBACK_TOKEN");
const TOKEN_UNSET = "unset";

const Body = z.object({
  reportIds: z.array(z.string().min(1).max(128)).min(1).max(50),
  version: z.string().max(60).default(""),
});

function tokenOk(req: Request): boolean {
  const expected = CI_FEEDBACK_TOKEN.value();
  if (!expected || expected === TOKEN_UNSET) return false;
  const a = Buffer.from(req.get("x-ci-token") ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const markFeedbackShipped = onRequest(
  { region: "us-central1", secrets: [CI_FEEDBACK_TOKEN] },
  async (req: Request, res: Response) => {
    if (req.method !== "POST") return void res.status(405).json({ error: "POST only" });
    if (!tokenOk(req)) return void res.status(401).json({ error: "unauthorized" });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "bad_request" });

    const shipped: string[] = [];
    const missing: string[] = [];
    for (const id of parsed.data.reportIds) {
      const hits = await db.collectionGroup("feedback").where("reportId", "==", id).limit(1).get();
      const doc = hits.docs[0];
      if (!doc) {
        missing.push(id);
        continue;
      }
      if (doc.data().status === "shipped") continue;
      await doc.ref.update({
        status: "shipped",
        shippedAt: FieldValue.serverTimestamp(),
        shippedVersion: parsed.data.version,
        updatedAt: FieldValue.serverTimestamp(),
      });
      shipped.push(id);
    }
    logger.info("markFeedbackShipped", { shipped, missing, version: parsed.data.version });
    res.json({ ok: true, shipped, missing });
  },
);
