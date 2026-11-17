// Page entry point: picks a location, computes sunsets and renders them.

import { sunsetSummary, formatHours } from "./calc.js";
import {
  CLOCK_SIZE, clear, drawFace, drawNose, drawMinuteHand, drawHourHand, drawRimMarker,
} from "./clock.js";

const DEFAULT_LOCATION = { lat: 42.3653766, lon: -71.1853512 };
const STORAGE_KEYS = { lat: "sunsetLat", lon: "sunsetLon" };
const DATE_FORMAT = { weekday: "short", day: "numeric", month: "short", year: "numeric" };

const canvas = document.getElementById("clock");
const info = document.getElementById("sunset-info");
const locationLine = document.getElementById("location");

// The most recent render, so the clock can be redrawn on resize or theme change.
let current = null;

// ---------- Location ----------

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

function formatCoords({ lat, lon }) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

// ---------- Clock ----------

function readTheme() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  return {
    face: v("--clock-face"),
    ink: v("--clock-ink"),
    muted: v("--clock-muted"),
    sun: v("--sun"),
    upcoming: v("--upcoming"),
    crep: v("--crep"),
    font: v("--font-body"),
  };
}

// Size the canvas backing store to its displayed size, so it stays sharp.
function prepareCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const size = Math.max(1, Math.round(canvas.clientWidth * ratio));
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  const ctx = canvas.getContext("2d");
  const scale = size / CLOCK_SIZE;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return ctx;
}

function renderClock(summary) {
  const ctx = prepareCanvas();
  const theme = readTheme();
  clear(ctx);
  drawFace(ctx, theme);

  // Next 14 days: fade from strong (tomorrow) to faint (two weeks out).
  const count = summary.upcomingHours.length;
  summary.upcomingHours.forEach((hours, i) => {
    drawMinuteHand(ctx, hours, theme.upcoming, 1.5, 0.9 - 0.75 * (i / count));
  });

  drawMinuteHand(ctx, summary.earliestHours, theme.crep, 2);
  drawRimMarker(ctx, summary.earliestHours, theme.crep);

  drawHourHand(ctx, summary.todayHours, theme.ink);
  drawMinuteHand(ctx, summary.todayHours, theme.ink, 5);
  drawNose(ctx, theme);
}

// ---------- Text ----------

// "4:23:49 PM" with the seconds and AM/PM de-emphasized.
function timeHtml(hours) {
  const text = formatHours(hours);
  const match = text.match(/^(\d+:\d\d)(:\d\d) (AM|PM)$/);
  if (!match) return text;
  return `${match[1]}<span class="sec">${match[2]}</span> <span class="ampm">${match[3]}</span>`;
}

function changeText(todayHours, tomorrowHours) {
  if (todayHours === null || tomorrowHours === null) return "";
  const seconds = Math.round((tomorrowHours - todayHours) * 3600);
  if (seconds === 0) return "Same as today";
  return seconds < 0 ? `${-seconds} s earlier` : `${seconds} s later`;
}

function countdownHtml(days) {
  if (days === 0) {
    return {
      number: "Today",
      label: "is Crepusculus",
    };
  }
  return {
    number: String(days),
    label: `${days === 1 ? "day" : "days"} until Crepusculus`,
  };
}

function renderInfo(summary) {
  const { today, todayHours, tomorrowHours, earliestDay, earliestHours, daysUntilEarliest } = summary;
  const countdown = countdownHtml(daysUntilEarliest);

  info.innerHTML = `
    <div class="countdown">
      <div class="countdown-number">${countdown.number}</div>
      <div>
        <p class="countdown-label">${countdown.label}</p>
        <p class="countdown-detail">
          Today's date: <strong>${today.toLocaleDateString("en-US", DATE_FORMAT)}</strong><br>
          Earliest sunset: <strong>${earliestDay.toLocaleDateString("en-US", DATE_FORMAT)}</strong>
          at <strong>${formatHours(earliestHours)}</strong>
        </p>
      </div>
    </div>

    <div class="tiles">
      <div class="tile">
        <div class="tile-label">Sunset today</div>
        <div class="tile-value">${timeHtml(todayHours)}</div>
      </div>
      <div class="tile">
        <div class="tile-label">Tomorrow</div>
        <div class="tile-value">${timeHtml(tomorrowHours)}</div>
        <div class="tile-note">${changeText(todayHours, tomorrowHours)}</div>
      </div>
    </div>

    <ul class="legend" aria-label="Clock legend">
      <li><span class="swatch swatch-today"></span>Today</li>
      <li><span class="swatch swatch-upcoming"></span>Next 14 days</li>
      <li><span class="swatch swatch-crep"></span>Earliest sunset</li>
    </ul>`;
}

function mapsUrl({ lat, lon }) {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lon.toFixed(5)}`;
}

// "Sunsets for 42.37° N, 71.19° W · <your current location>", where the
// location phrase links to Google Maps so people can check the place.
function renderLocation(location, source) {
  const link = document.createElement("a");
  link.href = mapsUrl(location);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = source;
  link.title = "Show this location in Google Maps";
  locationLine.replaceChildren(`Sunsets for ${formatCoords(location)} · `, link);
}

// ---------- Main ----------

function render(location, source) {
  const summary = sunsetSummary(location.lat, location.lon);
  current = summary;
  renderClock(summary);
  renderInfo(summary);
  renderLocation(location, source);
}

async function start() {
  // Make sure the clock numbers are drawn in the page font, not a fallback.
  try {
    await document.fonts.load(`500 22px ${readTheme().font}`);
  } catch {
    // Draw with whatever font is available.
  }

  // Draw right away with the last known location (or the default),
  // then ask for the current position and redraw if we get one.
  const stored = loadStoredLocation();
  if (stored) {
    render(stored, "last known location");
  } else {
    render(DEFAULT_LOCATION, "default location");
  }

  navigator.geolocation?.getCurrentPosition(
    ({ coords }) => {
      const location = { lat: coords.latitude, lon: coords.longitude };
      storeLocation(location);
      render(location, "your current location");
    },
    () => {} // Keep showing the stored or default location.
  );

  // Redraw the clock when its size or the light/dark theme changes.
  new ResizeObserver(() => current && renderClock(current)).observe(canvas);
  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => current && renderClock(current));
}

start();
