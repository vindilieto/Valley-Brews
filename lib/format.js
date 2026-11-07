export const CATEGORIES = ["Specials", "Events", "Food", "Game Day"];
export const FREE_POST_LIMIT = 5;

// Today's date in State College as YYYY-MM-DD, no matter where the server runs.
export function todayInStateCollege() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
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

export function formatDate(date) {
  // Noon keeps the date from slipping a day in other time zones.
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
