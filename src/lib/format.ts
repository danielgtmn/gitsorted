const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const rtf = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });

export function formatDate(iso: string | null): string {
  return iso ? dateFmt.format(new Date(iso)) : "–";
}

export function formatRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return "nie";
  const diff = (Date.parse(iso) - now) / 1000;
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "gerade eben";
}

export function formatSize(kb: number): string {
  if (kb === 0) return "leer";
  if (kb < 1024) return `${kb} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / 1024 / 1024).toFixed(1)} GB`;
}
