// Which wizard steps show for whom (PLAN.md 4.19, "what smart means in
// code"). Pure, so the flow is testable without a browser.

export type SetupStepId = "people" | "google" | "found" | "money" | "done";

export interface SetupContext {
  role: "adult" | "child";
  /** The person who created the household. */
  founder: boolean;
  googleConnected: boolean;
}

export interface SetupStep {
  id: SetupStepId;
  title: string;
}

export function planSetup(ctx: SetupContext): SetupStep[] {
  if (ctx.role !== "adult") return [];
  const steps: SetupStep[] = [];
  // The founder answers the household questions; an invited adult sees the
  // people as facts on the done screen instead.
  if (ctx.founder) steps.push({ id: "people", title: "Who lives here" });
  steps.push({ id: "google", title: "Connect Google" });
  // The scan needs a connected inbox; without one the step would only say so.
  if (ctx.googleConnected) steps.push({ id: "found", title: "What we found" });
  steps.push({ id: "money", title: "Money starter" });
  steps.push({ id: "done", title: "Today is ready" });
  return steps;
}
