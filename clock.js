// Drawing the clock face and its hands on a 2D canvas context.
// All drawing uses a 400 x 400 coordinate space; the caller scales the
// context to the canvas's real pixel size.

export const CLOCK_SIZE = 400;

const MID = CLOCK_SIZE / 2;
const FACE_RADIUS = 192;
const NUMBER_RADIUS = 156;
const MINUTE_HAND_LENGTH = 172;
const HOUR_HAND_LENGTH = 100;

// Angle on the face for a fraction of a full turn, with 0 at 12 o'clock.
function angleFor(fraction) {
  return 2 * Math.PI * fraction - Math.PI / 2;
}

function pointAt(angle, radius) {
  return [MID + radius * Math.cos(angle), MID + radius * Math.sin(angle)];
}

function drawHand(ctx, angle, color, length, width) {
  ctx.beginPath();
  ctx.moveTo(MID, MID);
  ctx.lineTo(...pointAt(angle, length));
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function clear(ctx) {
  ctx.clearRect(0, 0, CLOCK_SIZE, CLOCK_SIZE);
}

export function drawFace(ctx, theme) {
  ctx.beginPath();
  ctx.arc(MID, MID, FACE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = theme.face;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = theme.muted;
  ctx.stroke();

  ctx.font = `500 22px ${theme.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.ink;
  for (let i = 1; i <= 12; i++) {
    ctx.fillText(String(i), ...pointAt(angleFor(i / 12), NUMBER_RADIUS));
  }

  ctx.lineCap = "round";
  for (let mark = 0; mark < 60; mark++) {
    const isHourMark = mark % 5 === 0;
    const angle = angleFor(mark / 60);
    ctx.beginPath();
    ctx.moveTo(...pointAt(angle, FACE_RADIUS - (isHourMark ? 14 : 8)));
    ctx.lineTo(...pointAt(angle, FACE_RADIUS - 4));
    ctx.lineWidth = isHourMark ? 3 : 1.25;
    ctx.strokeStyle = isHourMark ? theme.ink : theme.muted;
    ctx.stroke();
  }
}

export function drawNose(ctx, theme) {
  ctx.beginPath();
  ctx.arc(MID, MID, 9, 0, Math.PI * 2);
  ctx.fillStyle = theme.sun;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(MID, MID, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = theme.face;
  ctx.fill();
}

// Minute hand for a time given in decimal hours. Optional alpha fades it.
export function drawMinuteHand(ctx, hours, color, width, alpha = 1) {
  if (hours === null) return;
  ctx.globalAlpha = alpha;
  drawHand(ctx, angleFor(hours % 1), color, MINUTE_HAND_LENGTH, width);
  ctx.globalAlpha = 1;
}

// A dot at the rim, marking where a minute hand points.
export function drawRimMarker(ctx, hours, color) {
  if (hours === null) return;
  ctx.beginPath();
  ctx.arc(...pointAt(angleFor(hours % 1), MINUTE_HAND_LENGTH + 8), 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// Hour hand for a time given in decimal hours.
export function drawHourHand(ctx, hours, color) {
  if (hours === null) return;
  drawHand(ctx, angleFor((hours % 12) / 12), color, HOUR_HAND_LENGTH, 8);
}
