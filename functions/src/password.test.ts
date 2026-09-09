import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("round-trips and rejects the wrong word", () => {
    const stored = hashPassword("bench-2026");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("bench-2026", stored)).toBe(true);
    expect(verifyPassword("bench-2025", stored)).toBe(false);
  });
  it("salts, so the same password hashes differently twice", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });
  it("refuses malformed stored values", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "md5$abc")).toBe(false);
  });
});
