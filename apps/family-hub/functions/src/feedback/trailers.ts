// The commit trailer that ties a fix to a report:  Feedback-Id: <reportId>
// One per line, any number per commit. CI collects them from the pushed
// range and calls markFeedbackShipped after hosting deploys.

const TRAILER = /^Feedback-Id:\s*([A-Za-z0-9_-]{1,128})\s*$/gm;

/** Every Feedback-Id trailer in a block of commit messages, deduped, in order. */
export function feedbackIdsFrom(messages: string): string[] {
  const out: string[] = [];
  for (const m of messages.matchAll(TRAILER)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}
