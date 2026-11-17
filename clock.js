// Drawing the clock face and its hands on a 2D canvas context.
// All drawing uses a 400 x 400 coordinate space; the caller scales the
// context to the canvas's real pixel size.

export const CLOCK_SIZE = 400;

const MID = CLOCK_SIZE / 2;

// Rings, from the outside in.
const BEZEL_RADIUS = 192;        // outer rim
const BEZEL_INNER_RADIUS = 187;  // hairline just inside the rim
const TRACK_OUTER = 179;         // minute track ("railway") outer edge
const TRACK_INNER = 171;         // minute track inner edge
const HOUR_MARK_INNER = 163;     // hour batons reach in past the track
const NUMBER_RADIUS = 143;

// Hands.
const MINUTE_HAND = { length: 168, tail: 24, width: 8, shoulder: 30 };
const HOUR_HAND = { length: 106, tail: 18, width: 13, shoulder: 26 };
const DATA_LINE_LENGTH = 168;    // the thin lines for other days

// Angle on the face for a fraction of a full turn, with 0 at 12 o'clock.
function angleFor(fraction) {
  return 2 * Math.PI * fraction - Math.PI / 2;
}

function pointAt(angle, radius) {
  return [MID + radius * Math.cos(angle), MID + radius * Math.sin(angle)];
}

function circle(ctx, radius) {
  ctx.beginPath();
  ctx.arc(MID, MID, radius, 0, Math.PI * 2);
}

function radialLine(ctx, angle, inner, outer, width, color) {
  ctx.beginPath();
  ctx.moveTo(...pointAt(angle, inner));
  ctx.lineTo(...pointAt(angle, outer));
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function clear(ctx) {
  ctx.clearRect(0, 0, CLOCK_SIZE, CLOCK_SIZE);
}

export function drawFace(ctx, theme) {
  // Face, with faint shading toward the rim.
  const shade = ctx.createRadialGradient(MID, MID, 0, MID, MID, BEZEL_RADIUS);
  shade.addColorStop(0, theme.face);
  shade.addColorStop(0.7, theme.face);
  shade.addColorStop(1, theme.faceEdge);
  circle(ctx, BEZEL_RADIUS);
  ctx.fillStyle = shade;
  ctx.fill();

  // Double rim: a firm outer ring and a hairline just inside it.
  circle(ctx, BEZEL_RADIUS);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = theme.ink;
  ctx.stroke();
  circle(ctx, BEZEL_INNER_RADIUS);
  ctx.lineWidth = 0.75;
  ctx.strokeStyle = theme.muted;
  ctx.stroke();

  // Minute track: two hairline rings with a tick across for each minute.
  for (const r of [TRACK_OUTER, TRACK_INNER]) {
    circle(ctx, r);
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = theme.muted;
    ctx.stroke();
  }
  ctx.lineCap = "butt";
  for (let mark = 0; mark < 60; mark++) {
    const angle = angleFor(mark / 60);
    if (mark % 5 === 0) {
      radialLine(ctx, angle, HOUR_MARK_INNER, TRACK_OUTER, 3, theme.ink);
    } else {
      radialLine(ctx, angle, TRACK_INNER, TRACK_OUTER, 1, theme.muted);
    }
  }

  // Serif numerals.
  ctx.font = `500 26px ${theme.fontDisplay}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.ink;
  for (let i = 1; i <= 12; i++) {
    const [x, y] = pointAt(angleFor(i / 12), NUMBER_RADIUS);
    ctx.fillText(String(i), x, y + 1);
  }
}

// A tapered (dauphine-style) hand: widest at a shoulder a little way out
// from the centre, narrowing to a point at the tip and to a short blunt
// tail behind the centre.
function drawTaperedHand(ctx, angle, { length, tail, width, shoulder }, color) {
  const along = (r) => [Math.cos(angle) * r, Math.sin(angle) * r];
  const across = (w) => [-Math.sin(angle) * w, Math.cos(angle) * w];
  const pt = (r, w) => {
    const [ax, ay] = along(r);
    const [cx, cy] = across(w);
    return [MID + ax + cx, MID + ay + cy];
  };

  ctx.beginPath();
  ctx.moveTo(...pt(length, 0));                // tip
  ctx.lineTo(...pt(shoulder, width / 2));      // widest point
  ctx.lineTo(...pt(0, width * 0.32));          // narrower at the centre
  ctx.lineTo(...pt(-tail, width * 0.22));      // tail
  ctx.lineTo(...pt(-tail, -width * 0.22));
  ctx.lineTo(...pt(0, -width * 0.32));
  ctx.lineTo(...pt(shoulder, -width / 2));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawNose(ctx, theme) {
  circle(ctx, 7.5);
  ctx.fillStyle = theme.ink;
  ctx.fill();
  circle(ctx, 2.5);
  ctx.fillStyle = theme.face;
  ctx.fill();
}

// A thin line from the centre for a time given in decimal hours, used for
// days other than today. Optional alpha fades it.
export function drawMinuteHand(ctx, hours, color, width, alpha = 1) {
  if (hours === null) return;
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  radialLine(ctx, angleFor(hours % 1), 0, DATA_LINE_LENGTH, width, color);
  ctx.globalAlpha = 1;
}

// A dot at the rim, marking where a minute line points.
export function drawRimMarker(ctx, hours, color) {
  if (hours === null) return;
  // Sits in the minute track, like a marker on the dial.
  ctx.beginPath();
  ctx.arc(...pointAt(angleFor(hours % 1), (TRACK_INNER + TRACK_OUTER) / 2), 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// Today's hands, for a time given in decimal hours.
export function drawTodayHands(ctx, hours, color) {
  if (hours === null) return;
  drawTaperedHand(ctx, angleFor((hours % 12) / 12), HOUR_HAND, color);
  drawTaperedHand(ctx, angleFor(hours % 1), MINUTE_HAND, color);
}
