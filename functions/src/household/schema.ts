import { z } from "zod";

// Zod at the boundary for every household callable. Colours are a short
// fixed list so nothing unreadable lands on the Today screen.

export const PERSON_COLOURS = ["#37ff8b", "#7fd0ff", "#f5c56b", "#d3a5ff", "#ff9ab5", "#9ee8d0"] as const;
export const colour = z.enum(PERSON_COLOURS);
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
export const personName = z.string().trim().min(1).max(60);

export const CreateHousehold = z.object({
  name: z.string().trim().min(1).max(80),
  timeZone: z.string().min(1).max(64),
  yourName: personName,
  colour,
  birthDate: day.optional(),
});
export type CreateHousehold = z.infer<typeof CreateHousehold>;

export const CreateInvite = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: personName,
  colour,
});
export type CreateInvite = z.infer<typeof CreateInvite>;

export const AcceptInvite = z.object({
  hid: z.string().min(1).max(64),
  inviteId: z.string().min(1).max(64),
  token: z.string().min(20).max(200),
});
export type AcceptInvite = z.infer<typeof AcceptInvite>;

export const AddChild = z.object({
  name: personName,
  birthDate: day,
  colour,
});
export type AddChild = z.infer<typeof AddChild>;

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
