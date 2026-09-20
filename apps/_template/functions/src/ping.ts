import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { callOpts } from "./lib/callOpts";
import { requireSignedIn } from "./lib/tenant";

const Input = z.object({ text: z.string().max(200).default("") });

/** The one callable the template ships: proves auth, Zod and App Check wiring. */
export const ping = onCall(callOpts(), async (request) => {
  const { uid } = requireSignedIn(request);
  const input = Input.parse(request.data);
  return { uid, echo: input.text, at: new Date().toISOString() };
});
