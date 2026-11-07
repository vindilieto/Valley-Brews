export const CATEGORIES = ["Specials", "Events", "Food", "Game Day"];
export const FREE_POST_LIMIT = 5;

// Today's date in State College as YYYY-MM-DD, no matter where the server runs.
export function todayInStateCollege() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

// "2026-11-07" plus 3 days -> "2026-11-10"
export function addDays(date, days) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function formatTime(time) {
  if (!time) return "";
  if (time === "close") return "close";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return minutes ? `${hour}:${String(minutes).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

export function formatTimes(start, end) {
  if (start && end) return `${formatTime(start)} to ${formatTime(end)}`;
  if (end) return `until ${formatTime(end)}`;
  return formatTime(start);
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// [2] -> "Every Tuesday", [6, 0] -> "Every Sat & Sun"
export function formatRepeat(days) {
  if (!days?.length) return "";
  if (days.length === 7) return "Every day";
  if (days.length === 1) return `Every ${WEEKDAYS[days[0]]}`;
  // Start the week on Monday so weekends read "Sat & Sun".
  const names = [...days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((day) => WEEKDAYS[day].slice(0, 3));
  return `Every ${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}

export function formatDate(date) {
  // Noon keeps the date from slipping a day in other time zones.
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
