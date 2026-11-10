// Month helpers for revenue reporting.
//
// toISOString() converts to UTC, so a local-midnight date on the 1st of a
// month (e.g. Nov 1 in Europe/Tirane, UTC+1) becomes the previous month's
// last day (2026-10-31T23:00Z). Deriving a "YYYY-MM" key that way puts each
// month's revenue under the next month's label for anyone east of UTC.

/** "YYYY-MM" for the date's own calendar month, never the UTC one. */
export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export type MonthBucket = { key: string; label: string };

/**
 * The last `count` calendar months ending with `now`'s month, oldest first.
 * `key` and `label` always describe the same month.
 */
export const recentMonthBuckets = (now: Date, count = 6): MonthBucket[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1) + i, 1);
    return {
      key: monthKey(d),
      label: d.toLocaleString("en", { month: "short" }),
    };
  });
