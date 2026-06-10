import { describe, it, expect } from "vitest";
import {
  parseOpeningHours,
  accraDayAndMinutes,
  isOpenNow,
  todayHours,
  formatWeek,
  formatGhanaPhone,
  type OpeningHours,
} from "@/lib/clinic-hours";
import type { Json } from "@/db/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Mirrors stdHours in src/lib/seed.ts (late Friday close, Sunday closed).
const week: OpeningHours = {
  mon: { open: "08:00", close: "19:00", closed: false },
  tue: { open: "08:00", close: "19:00", closed: false },
  wed: { open: "08:00", close: "19:00", closed: false },
  thu: { open: "08:00", close: "19:00", closed: false },
  fri: { open: "08:00", close: "20:00", closed: false },
  sat: { open: "09:00", close: "18:00", closed: false },
  sun: { open: null, close: null, closed: true },
};

// Accra is UTC+0 year-round, so UTC instants map 1:1 to Accra wall time.
// 2026-06-09 is a Tuesday; 2026-06-14 is a Sunday.
const tue1230 = new Date("2026-06-09T12:30:00Z");
const sunNoon = new Date("2026-06-14T12:00:00Z");

// ─── parseOpeningHours ────────────────────────────────────────────────────────

describe("parseOpeningHours", () => {
  it("accepts a full valid week", () => {
    expect(parseOpeningHours(week as unknown as Json)).toEqual(week);
  });

  it("accepts a closed day with null open/close", () => {
    const parsed = parseOpeningHours(week as unknown as Json);
    expect(parsed?.sun).toEqual({ open: null, close: null, closed: true });
  });

  it("rejects null", () => {
    expect(parseOpeningHours(null)).toBeNull();
  });

  it("rejects an array", () => {
    expect(parseOpeningHours([] as unknown as Json)).toBeNull();
  });

  it("rejects a string", () => {
    expect(parseOpeningHours("08:00" as Json)).toBeNull();
  });

  it("rejects a week with a missing day key", () => {
    const { sun: _sun, ...missing } = week;
    expect(parseOpeningHours(missing as unknown as Json)).toBeNull();
  });

  it("rejects non-string open time", () => {
    const bad = { ...week, mon: { open: 8, close: "19:00", closed: false } };
    expect(parseOpeningHours(bad as unknown as Json)).toBeNull();
  });

  it("rejects malformed time strings", () => {
    const bad = {
      ...week,
      mon: { open: "8am", close: "19:00", closed: false },
    };
    expect(parseOpeningHours(bad as unknown as Json)).toBeNull();
  });

  it("rejects a non-boolean closed flag", () => {
    const bad = {
      ...week,
      mon: { open: "08:00", close: "19:00", closed: "no" },
    };
    expect(parseOpeningHours(bad as unknown as Json)).toBeNull();
  });
});

// ─── accraDayAndMinutes ───────────────────────────────────────────────────────

describe("accraDayAndMinutes", () => {
  it("maps a UTC instant to the Accra day and minutes", () => {
    expect(accraDayAndMinutes(new Date("2026-06-09T07:30:00Z"))).toEqual({
      day: "tue",
      minutes: 450,
    });
  });

  it("resolves midnight boundaries in Accra time, not server time", () => {
    // 23:59 UTC Saturday is still Saturday in Accra (UTC+0).
    expect(accraDayAndMinutes(new Date("2026-06-13T23:59:00Z"))).toEqual({
      day: "sat",
      minutes: 23 * 60 + 59,
    });
    // One minute later it's Sunday 00:00.
    expect(accraDayAndMinutes(new Date("2026-06-14T00:00:00Z"))).toEqual({
      day: "sun",
      minutes: 0,
    });
  });
});

// ─── isOpenNow ────────────────────────────────────────────────────────────────

describe("isOpenNow", () => {
  it("is open mid-hours on a weekday", () => {
    expect(isOpenNow(week, tue1230)).toBe(true);
  });

  it("is closed before opening time", () => {
    expect(isOpenNow(week, new Date("2026-06-09T07:59:00Z"))).toBe(false);
  });

  it("is open exactly at opening time", () => {
    expect(isOpenNow(week, new Date("2026-06-09T08:00:00Z"))).toBe(true);
  });

  it("is closed exactly at closing time", () => {
    expect(isOpenNow(week, new Date("2026-06-09T19:00:00Z"))).toBe(false);
  });

  it("is closed on a closed day", () => {
    expect(isOpenNow(week, sunNoon)).toBe(false);
  });

  it("respects the late Friday close from the seed data", () => {
    // Friday 19:30 — past the weekday close but inside Friday's 20:00 close.
    expect(isOpenNow(week, new Date("2026-06-12T19:30:00Z"))).toBe(true);
  });
});

// ─── todayHours / formatWeek ──────────────────────────────────────────────────

describe("todayHours", () => {
  it("formats an open day", () => {
    expect(todayHours(week, tue1230)).toBe("08:00 – 19:00");
  });

  it("formats a closed day", () => {
    expect(todayHours(week, sunNoon)).toBe("Closed");
  });
});

describe("formatWeek", () => {
  it("returns Mon-first rows with today flagged", () => {
    const rows = formatWeek(week, tue1230);
    expect(rows.map((r) => r.label)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(rows[1]).toEqual({
      label: "Tue",
      display: "08:00 – 19:00",
      isToday: true,
    });
    expect(rows.filter((r) => r.isToday)).toHaveLength(1);
    expect(rows[6].display).toBe("Closed");
  });
});

// ─── formatGhanaPhone ─────────────────────────────────────────────────────────

describe("formatGhanaPhone", () => {
  it("formats Accra landlines", () => {
    expect(formatGhanaPhone("+233302700218")).toBe("030 270 0218");
  });

  it("formats Kumasi landlines", () => {
    expect(formatGhanaPhone("+233322201500")).toBe("032 220 1500");
  });

  it("returns non-Ghana input unchanged", () => {
    expect(formatGhanaPhone("+442071234567")).toBe("+442071234567");
  });
});
