/** A plain, PII-free dump of the device for a feedback report. */
export function environmentDump(): string {
  const n = typeof navigator === "undefined" ? null : navigator;
  const w = typeof window === "undefined" ? null : window;
  const lines = [
    `ua: ${n?.userAgent ?? "?"}`,
    `platform: ${n?.platform ?? "?"}`,
    `language: ${n?.language ?? "?"}`,
    `online: ${n ? String(n.onLine) : "?"}`,
    `screen: ${w ? `${w.screen.width}x${w.screen.height}` : "?"}`,
    `viewport: ${w ? `${w.innerWidth}x${w.innerHeight}` : "?"}`,
    `dpr: ${w?.devicePixelRatio ?? "?"}`,
    `standalone: ${w && "matchMedia" in w ? String(w.matchMedia("(display-mode: standalone)").matches) : "?"}`,
    `tz: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
  ];
  return lines.join("\n");
}
