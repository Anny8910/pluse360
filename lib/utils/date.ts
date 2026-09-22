export function nowInTimezone(timezone?: string | null): Date {
  if (!timezone) return new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "01";
  return new Date(
    Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day")))
  );
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayKey(timezone?: string | null): string {
  return dayKey(nowInTimezone(timezone));
}

export function utcDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function daysAgoKey(days: number, timezone?: string | null): string {
  const ref = nowInTimezone(timezone);
  ref.setUTCDate(ref.getUTCDate() - days);
  return dayKey(ref);
}

export function formatDateKey(key: string): string {
  const date = new Date(`${key}T12:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}