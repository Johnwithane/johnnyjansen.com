import { describe, expect, it } from "vitest";
import { AcceptInvite, AddChild, CreateHousehold, CreateInvite } from "./schema";

describe("household schemas", () => {
  it("createHousehold trims and requires a colour from the list", () => {
    expect(CreateHousehold.parse({ name: " The Jansens ", timeZone: "America/Vancouver", yourName: "Johnny", colour: "#37ff8b" }).name).toBe("The Jansens");
    expect(() => CreateHousehold.parse({ name: "x", timeZone: "America/Vancouver", yourName: "J", colour: "#000000" })).toThrow();
  });
  it("createInvite lowercases the email", () => {
    expect(CreateInvite.parse({ email: "Carly@Example.com", name: "Carly", colour: "#7fd0ff" }).email).toBe("carly@example.com");
    expect(() => CreateInvite.parse({ email: "not-an-email", name: "C", colour: "#7fd0ff" })).toThrow();
  });
  it("acceptInvite needs a real token", () => {
    expect(() => AcceptInvite.parse({ hid: "h", inviteId: "i", token: "short" })).toThrow();
  });
  it("addChild needs a birth date", () => {
    expect(() => AddChild.parse({ name: "Forest", colour: "#f5c56b" })).toThrow();
    expect(AddChild.parse({ name: "Forest", birthDate: "2017-02-06", colour: "#f5c56b" }).birthDate).toBe("2017-02-06");
  });
});
