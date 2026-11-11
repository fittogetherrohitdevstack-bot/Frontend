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
