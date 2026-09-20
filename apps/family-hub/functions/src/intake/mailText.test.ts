import { describe, expect, it } from "vitest";
import { extractText, stripHtml } from "./mailText";

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("extractText", () => {
  it("prefers the plain part of a multipart message", () => {
    const payload = {
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/plain", body: { data: b64("Picture day is Friday.") } },
        { mimeType: "text/html", body: { data: b64("<p>Picture day is <b>Friday</b>.</p>") } },
      ],
    };
    expect(extractText(payload)).toBe("Picture day is Friday.");
  });
  it("strips html when there is no plain part, and caps the length", () => {
    const payload = { mimeType: "text/html", body: { data: b64("<style>p{}</style><div>Hot lunch<br>$5 due Oct 3</div>") } };
    expect(extractText(payload)).toBe("Hot lunch\n$5 due Oct 3");
    expect(extractText({ mimeType: "text/plain", body: { data: b64("x".repeat(100)) } }, 10)).toHaveLength(10);
  });
  it("handles a missing payload", () => {
    expect(extractText(undefined)).toBe("");
    expect(stripHtml("a &amp; b")).toBe("a & b");
  });
});
