const DAY_MS = 86_400_000;

/** Validates whether a given string is a strict YYYY-MM-DD ISO calendar date. */
export function isValidISO(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/** Whole days since 1970-01-01 (UTC) for a YYYY-MM-DD string. */
export function toDayNumber(iso: string): number {
  return Math.round(new Date(`${iso}T00:00:00Z`).getTime() / DAY_MS);
}

/** Converts an epoch day integer into a YYYY-MM-DD ISO string. */
export function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Adds or subtracts whole calendar days from an ISO date string. */
export function addDays(iso: string, days: number): string {
  return fromDayNumber(toDayNumber(iso) + days);
}

/** Days from `a` to `b` (positive when b is later). */
export function diffDays(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

const dayMonth = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "15 Feb 2027" for messages the engine writes. */
export function formatDayMonth(iso: string): string {
  return dayMonth.format(new Date(`${iso}T00:00:00Z`));
}
