import { computed } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { Suggestion, WithId } from "@/firebase/interfaces";
import { createBill } from "@/firebase/services/billsService";
import { createEvent } from "@/firebase/services/eventsService";
import { createAccount, createTransaction } from "@/firebase/services/moneyService";
import { resolveSuggestion } from "@/firebase/services/suggestionsService";
import { createTask } from "@/firebase/services/tasksService";
import { dayKeyOf } from "@/utils/localTime";

// Accepting a suggestion (PLAN.md section 5) applies its payload through the
// SAME service a hand-made write uses, so the rules gate it exactly the same
// way; then the suggestion is marked accepted. Review and the setup wizard
// share this so a tick means the same thing on both screens.

type Applier = (p: Record<string, unknown>) => Promise<unknown>;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, fallback = "") => (v == null || v === "" ? fallback : String(v));

export function useSuggestionAppliers() {
  const { hid, uid, isMfa } = useAuth();
  const h = hid.value ?? "";
  const me = uid.value ?? "";

  const APPLIERS: Partial<Record<Suggestion["kind"], Applier>> = {
    event: (p) =>
      createEvent(h, me, {
        title: str(p.title, "Event"),
        start: str(p.start),
        end: p.end ? str(p.end) : undefined,
        allDay: !str(p.start).includes("T"),
        kind: (["event", "bill", "birthday", "renewal", "trip", "school"].includes(str(p.kind)) ? str(p.kind) : "event") as "event",
        memberIds: Array.isArray(p.memberIds) ? (p.memberIds as string[]) : [],
        location: p.location ? str(p.location) : undefined,
        notes: p.notes ? str(p.notes) : undefined,
        source: "intake",
      }),
    task: (p) => createTask(h, me, { title: str(p.title, "Task"), visibility: p.visibility === "private" ? "private" : "household", due: p.due ? str(p.due) : null, notes: p.notes ? str(p.notes) : undefined }),
    bill: (p) =>
      createBill(h, me, {
        name: str(p.name, str(p.title, "Bill")),
        amount: Number(p.amount ?? 0),
        cadence: (["weekly", "monthly", "quarterly", "yearly", "once"].includes(str(p.cadence)) ? str(p.cadence) : "once") as "once",
        nextDue: DAY.test(str(p.nextDue)) ? str(p.nextDue) : dayKeyOf(new Date()),
        category: str(p.category, "kids"),
        notes: p.notes ? str(p.notes) : undefined,
        source: "intake",
      }),
    transaction: (p) =>
      createTransaction(h, me, {
        amount: Number(p.amount ?? 0),
        direction: p.direction === "income" ? "income" : "expense",
        date: DAY.test(str(p.date)) ? str(p.date) : dayKeyOf(new Date()),
        merchant: str(p.merchant, "Unknown"),
        category: str(p.category, "other"),
        taxCategory: p.taxCategory ? str(p.taxCategory) : undefined,
        notes: p.notes ? str(p.notes) : undefined,
        source: "import",
      }),
    account: (p) => createAccount(h, me, { name: str(p.name, "Account"), type: (["chequing", "savings", "credit", "cash", "loan"].includes(str(p.type)) ? str(p.type) : "chequing") as "chequing", visibility: "household" }),
  };

  // Money kinds need the second factor, like the Money screens; the rules
  // would deny the write anyway, so say so instead of failing.
  const MONEY_KINDS: Suggestion["kind"][] = ["bill", "transaction", "account"];

  function canApply(s: Pick<Suggestion, "kind">): boolean {
    return !!APPLIERS[s.kind] && (!MONEY_KINDS.includes(s.kind) || isMfa.value);
  }
  function whyNot(s: Pick<Suggestion, "kind">): string {
    if (!APPLIERS[s.kind]) return "Lands in a later phase";
    return "Needs your second factor (Security)";
  }
  /** Apply, then mark accepted. Neither write is awaited by the caller; the error, if any, comes back through onError. */
  function accept(s: WithId<Suggestion>, onError: (msg: string) => void): void {
    const apply = APPLIERS[s.kind];
    if (!apply) return;
    apply(s.payload).catch((e) => onError(e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not apply"));
    resolveSuggestion(h, s.id, "accepted", me).catch(() => undefined);
  }
  function dismiss(s: WithId<Suggestion>): void {
    resolveSuggestion(h, s.id, "dismissed", me).catch(() => undefined);
  }

  return { canApply, whyNot, accept, dismiss, needsMfa: computed(() => !isMfa.value) };
}
