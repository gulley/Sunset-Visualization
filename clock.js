// Drawing the clock face and its hands on a 2D canvas context.

const FACE_RADIUS = 195;
const NUMBER_RADIUS = 160;
const MINUTE_HAND_LENGTH = 180;
const HOUR_HAND_LENGTH = 100;
const BLACK = "#000000";

function center(ctx) {
  return ctx.canvas.width / 2;
}

// Angle on the face for a fraction of a full turn, with 0 at 12 o'clock.
function angleFor(fraction) {
  return 2 * Math.PI * fraction - Math.PI / 2;
}

function drawHand(ctx, angle, color, length, width) {
  const mid = center(ctx);
  ctx.beginPath();
  ctx.moveTo(mid, mid);
  ctx.lineTo(mid + length * Math.cos(angle), mid + length * Math.sin(angle));
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function clear(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawFace(ctx) {
  const mid = center(ctx);

  ctx.lineWidth = 2;
  ctx.strokeStyle = BLACK;
  ctx.beginPath();
  ctx.arc(mid, mid, FACE_RADIUS, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.stroke();

  ctx.font = "24px Roboto";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = BLACK;
  for (let i = 1; i <= 12; i++) {
    const angle = angleFor(i / 12);
    ctx.fillText(String(i), mid + NUMBER_RADIUS * Math.cos(angle), mid + NUMBER_RADIUS * Math.sin(angle));
  }

  for (let mark = 0; mark < 60; mark++) {
    const isHourMark = mark % 5 === 0;
    const angle = angleFor(mark / 60);
    const inner = FACE_RADIUS - (isHourMark ? 10 : 5);
    ctx.beginPath();
    ctx.moveTo(mid + inner * Math.cos(angle), mid + inner * Math.sin(angle));
    ctx.lineTo(mid + FACE_RADIUS * Math.cos(angle), mid + FACE_RADIUS * Math.sin(angle));
    ctx.lineWidth = isHourMark ? 4 : 1.5;
    ctx.stroke();
  }
}

export function drawNose(ctx) {
  const mid = center(ctx);
  ctx.beginPath();
  ctx.arc(mid, mid, 10, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = BLACK;
  ctx.fill();
}

// Minute hand for a time given in decimal hours.
export function drawMinuteHand(ctx, hours, color, width) {
  if (hours === null) return;
  drawHand(ctx, angleFor(hours % 1), color, MINUTE_HAND_LENGTH, width);
}

// Hour hand for a time given in decimal hours.
export function drawHourHand(ctx, hours) {
  if (hours === null) return;
  drawHand(ctx, angleFor((hours % 12) / 12), BLACK, HOUR_HAND_LENGTH, 10);
}
