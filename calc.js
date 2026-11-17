// Sunset calculations. No DOM access, so this module can be tested on its own.
// Uses the SunCalc global loaded by index.html.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Local noon on the calendar day of d. SunCalc's answer depends on the time of
// day it is given, so always ask about noon to get that calendar day's sunset.
export function localNoon(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

export function addDays(d, n) {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

// Whole calendar days from a to b. Ignores time of day and DST changes.
export function calendarDaysBetween(a, b) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

// Sunset on the calendar day of d, as decimal hours in local time,
// or null when the sun doesn't set that day.
export function sunsetHours(d, lat, lon) {
  const { sunset } = globalThis.SunCalc.getTimes(localNoon(d), lat, lon);
  // SunCalc returns an Invalid Date (not null) when there is no sunset.
  if (!sunset || Number.isNaN(sunset.getTime())) return null;
  return sunset.getHours() + sunset.getMinutes() / 60 + sunset.getSeconds() / 3600;
}

// The day (at local noon) with the earliest sunset in the coming year.
export function earliestSunsetDay(lat, lon, from = new Date(), numDays = 365) {
  let earliestDay = localNoon(from);
  let min = Infinity;
  for (let i = 0; i < numDays; i++) {
    const day = addDays(localNoon(from), i);
    const hours = sunsetHours(day, lat, lon);
    if (hours !== null && hours < min) {
      min = hours;
      earliestDay = day;
    }
  }
  return earliestDay;
}

// Everything the page shows, computed for one location and one "today".
export function sunsetSummary(lat, lon, today = new Date(), numUpcoming = 14) {
  const earliestDay = earliestSunsetDay(lat, lon, today);
  return {
    today,
    todayHours: sunsetHours(today, lat, lon),
    tomorrowHours: sunsetHours(addDays(today, 1), lat, lon),
    // Sunsets for the next numUpcoming days, starting tomorrow.
    upcomingHours: Array.from({ length: numUpcoming }, (_, i) =>
      sunsetHours(addDays(today, i + 1), lat, lon)),
    earliestDay,
    earliestHours: sunsetHours(earliestDay, lat, lon),
    daysUntilEarliest: calendarDaysBetween(today, earliestDay),
  };
}

// Decimal hours as "h:mm:ss AM", or "N/A" for null.
export function formatHours(hours) {
  if (hours === null) return "N/A";
  const totalSeconds = Math.floor(hours * 3600);
  const h24 = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const pad = (n) => String(n).padStart(2, "0");
  return `${h12}:${pad(minutes)}:${pad(seconds)} ${suffix}`;
}
