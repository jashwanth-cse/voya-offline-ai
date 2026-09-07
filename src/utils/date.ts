/**
 * Formats an ISO date string to a human-readable format.
 * e.g. "2026-09-10" → "10 Sep 2026"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns the number of days between two ISO date strings.
 * e.g. ("2026-09-10", "2026-09-13") → 3
 */
export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Returns how many days remain in the trip from today.
 * Returns 0 if the trip has ended.
 */
export function daysRemaining(tripEndIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(tripEndIso);
  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Returns true if today falls within the trip dates.
 */
export function isTripActive(startIso: string, endIso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startIso);
  const end = new Date(endIso);
  return today >= start && today <= end;
}

/**
 * Returns today's date as an ISO date string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Adds N days to an ISO date string and returns the result.
 */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
