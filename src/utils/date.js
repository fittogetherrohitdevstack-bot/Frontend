/**
 * Frontend timezone-safe calendar helpers (respecting user.timezone, default Asia/Kolkata).
 */

export const getLocalDateString = (date = new Date(), timezone = "Asia/Kolkata") => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date(date));
  } catch (_) {
    return new Date(date).toISOString().split("T")[0];
  }
};

export const addDaysToDateString = (dateString, deltaDays = 0) => {
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().split("T")[0];
};

export const getSignedDaysDiff = (fromDateStr, toDateStr) => {
  const [y1, m1, d1] = fromDateStr.split("-").map(Number);
  const [y2, m2, d2] = toDateStr.split("-").map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
};

export const formatShortDateRange = (weekStart, weekEnd) => {
  if (!weekStart || !weekEnd) return "";
  try {
    const fmt = (iso) => {
      const [y, m, d] = iso.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    };
    return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
  } catch (_) {
    return `${weekStart} – ${weekEnd}`;
  }
};
