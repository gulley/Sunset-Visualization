// Page entry point: picks a location, computes sunsets and renders them.

import { sunsetSummary, formatHours } from "./calc.js";
import { clear, drawFace, drawNose, drawMinuteHand, drawHourHand } from "./clock.js";

const DEFAULT_LOCATION = { lat: 42.3653766, lon: -71.1853512 };
const STORAGE_KEYS = { lat: "sunsetLat", lon: "sunsetLon" };
const EARLIEST_COLOR = "#FFA0A0";
const DATE_FORMAT = { weekday: "short", day: "2-digit", month: "short", year: "numeric" };

const canvas = document.getElementById("clock");
const info = document.getElementById("sunset-info");

function loadStoredLocation() {
  try {
    const lat = localStorage.getItem(STORAGE_KEYS.lat);
    const lon = localStorage.getItem(STORAGE_KEYS.lon);
    if (lat && lon) return { lat: parseFloat(lat), lon: parseFloat(lon) };
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return null;
}

function storeLocation({ lat, lon }) {
  try {
    localStorage.setItem(STORAGE_KEYS.lat, lat);
    localStorage.setItem(STORAGE_KEYS.lon, lon);
  } catch {
    // Not fatal: we just won't remember it next time.
  }
}

// Blue fading toward white over the upcoming days.
function upcomingColor(i, count) {
  const v = Math.floor(255 * (i / count)).toString(16).padStart(2, "0");
  return `#${v}${v}FF`;
}

function renderClock(summary) {
  const ctx = canvas.getContext("2d");
  clear(ctx);
  drawFace(ctx);

  const count = summary.upcomingHours.length;
  summary.upcomingHours.forEach((hours, i) => {
    drawMinuteHand(ctx, hours, upcomingColor(i, count), 1);
  });

  drawMinuteHand(ctx, summary.todayHours, "#000000", 6);
  drawHourHand(ctx, summary.todayHours);
  drawMinuteHand(ctx, summary.earliestHours, EARLIEST_COLOR, 1);
  drawNose(ctx);
}

function countdownText(days) {
  if (days === 0) {
    return `Today is <span class="days-until-crepusculus">Crepusculus</span> (earliest sunset of the year).`;
  }
  const verb = days === 1 ? "is" : "are";
  const unit = days === 1 ? "day" : "days";
  return `There ${verb} <span class="days-until-crepusculus">${days}</span> ${unit} until Crepusculus (earliest sunset of the year).`;
}

function renderInfo(summary) {
  const { today, todayHours, tomorrowHours, earliestDay, earliestHours, daysUntilEarliest } = summary;
  const diffSeconds = todayHours !== null && tomorrowHours !== null
    ? Math.round(Math.abs(todayHours - tomorrowHours) * 3600)
    : 0;

  info.innerHTML = `
    <div class="sunset-info">
      <div class="current-date">${today.toLocaleDateString("en-US", DATE_FORMAT)}</div>

      <div class="sunset-times">
        <div class="sunset-row">
          <span>Sunset today</span>
          <span>${formatHours(todayHours)}</span>
        </div>
        <div class="sunset-row">
          <span>Sunset tomorrow</span>
          <span>${formatHours(tomorrowHours)}</span>
        </div>
        <div class="sunset-row">
          <span class="difference">difference = ${diffSeconds} sec</span>
        </div>
      </div>

      <div class="earliest-sunset">
        ${countdownText(daysUntilEarliest)}<br>
        It will occur at <span class="earliest-sunset-time">${formatHours(earliestHours)}</span>
        on <span class="earliest-sunset-date">${earliestDay.toLocaleDateString("en-US", DATE_FORMAT)}</span>
      </div>
    </div>`;
}

function render({ lat, lon }) {
  const summary = sunsetSummary(lat, lon);
  renderClock(summary);
  renderInfo(summary);
}

async function start() {
  // Make sure the clock numbers are drawn in Roboto, not a fallback font.
  try {
    await document.fonts.load("24px Roboto");
  } catch {
    // Draw with whatever font is available.
  }

  // Draw right away with the last known location (or the default),
  // then ask for the current position and redraw if we get one.
  render(loadStoredLocation() ?? DEFAULT_LOCATION);

  navigator.geolocation?.getCurrentPosition(
    ({ coords }) => {
      const location = { lat: coords.latitude, lon: coords.longitude };
      storeLocation(location);
      render(location);
    },
    () => {} // Keep showing the stored or default location.
  );
}

start();
