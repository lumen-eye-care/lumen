/**
 * Clinic opening-hours helpers — pure functions over the `clinics.opening_hours`
 * jsonb column ({mon:{open,close,closed},...}, times as "HH:MM" 24h strings).
 *
 * All "now"-dependent functions take an injectable Date and resolve it in the
 * Africa/Accra timezone (UTC+0 year-round) so results don't depend on where
 * the server happens to run.
 */

import type { Json } from "@/db/types";

export const DAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export type DayHours = {
  open: string | null;
  close: string | null;
  closed: boolean;
};

export type OpeningHours = Record<DayKey, DayHours>;

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isDayHours(value: unknown): value is DayHours {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const day = value as Record<string, unknown>;
  if (typeof day.closed !== "boolean") return false;
  const validTime = (t: unknown) =>
    t === null || (typeof t === "string" && TIME_RE.test(t));
  return validTime(day.open) && validTime(day.close);
}

/**
 * Narrow the raw jsonb column to OpeningHours. Returns null when any day is
 * missing or malformed — callers should omit the hours block rather than
 * render garbage (mirrors parseColors in src/server/frames.ts).
 */
export function parseOpeningHours(raw: Json): OpeningHours | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const result = {} as OpeningHours;
  for (const key of DAY_KEYS) {
    const day = record[key];
    if (!isDayHours(day)) return null;
    result[key] = { open: day.open, close: day.close, closed: day.closed };
  }
  return result;
}

/** Resolve a Date to the day-of-week + minutes-since-midnight in Accra. */
export function accraDayAndMinutes(now: Date): {
  day: DayKey;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const day = get("weekday").toLowerCase().slice(0, 3) as DayKey;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return { day, minutes };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Is the clinic open right now (Accra time)? open <= now < close. */
export function isOpenNow(hours: OpeningHours, now: Date = new Date()): boolean {
  const { day, minutes } = accraDayAndMinutes(now);
  const today = hours[day];
  if (today.closed || today.open === null || today.close === null) return false;
  return minutes >= toMinutes(today.open) && minutes < toMinutes(today.close);
}

function formatDay(day: DayHours): string {
  if (day.closed || day.open === null || day.close === null) return "Closed";
  return `${day.open} – ${day.close}`;
}

/** Today's hours as display text, e.g. "08:00 – 19:00" or "Closed". */
export function todayHours(
  hours: OpeningHours,
  now: Date = new Date(),
): string {
  const { day } = accraDayAndMinutes(now);
  return formatDay(hours[day]);
}

export type WeekRow = {
  label: string;
  display: string;
  isToday: boolean;
};

/** Mon-first week rows for the per-clinic hours table. */
export function formatWeek(
  hours: OpeningHours,
  now: Date = new Date(),
): WeekRow[] {
  const { day: today } = accraDayAndMinutes(now);
  return DAY_KEYS.map((key) => ({
    label: DAY_LABELS[key],
    display: formatDay(hours[key]),
    isToday: key === today,
  }));
}

/**
 * Format a stored E.164 Ghana number for display: +233302700218 → 030 270 0218.
 * Anything that isn't a +233 number is returned unchanged (hrefs always use
 * the raw E.164 value).
 */
export function formatGhanaPhone(e164: string): string {
  const match = /^\+233(\d{9})$/.exec(e164);
  if (!match) return e164;
  const local = `0${match[1]}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
