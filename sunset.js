function decToHms(tIn) {
  var hours = Math.floor(tIn);
  var minutes = Math.floor((tIn - hours) * 60);
  var seconds = Math.floor((tIn - hours - minutes / 60) * 60 * 60);
  if (hours > 12) {
    hours -= 12;
  }
  return hours + ":" + pad(minutes) + ":" + pad(seconds);
}

function decToMs(tIn) {
  var minutes = Math.floor(tIn * 60);
  var seconds = Math.floor((tIn - minutes / 60) * 60 * 60);
  return minutes + ":" + pad(seconds);
}

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function drawHand(ctx, angle, color, length, width) {
  var mid = 200;
  ctx.beginPath();
  ctx.moveTo(mid, mid);
  ctx.lineTo(mid + length * Math.cos(angle), mid + length * Math.sin(angle));
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawMinuteHand(ctx, tIn, color, width) {
  var hours = Math.floor(tIn);
  var minutes = Math.floor((tIn - hours) * 60);
  var angle = 2 * Math.PI * (tIn - hours);
  // Correct for the fact that east corresponds to 0 degrees, whereas north is 12:00
  angle -= Math.PI / 2;
  var length = 180;
  drawHand(ctx, angle, color, length, width);
}

function drawHourHand(ctx, tIn) {
  var hours = Math.floor(tIn);
  var minutes = Math.floor((tIn - hours) * 60);
  var angle = 2 * Math.PI * ((hours + minutes / 60.0) / 12.0);
  // Correct for the fact that east corresponds to 0 degrees, whereas north is 12:00
  angle -= Math.PI / 2;
  drawHand(ctx, angle, "#000000", 100, 10);
}

function drawClockFace(ctx, option) {
  // Draw the circle to make the clock face
  var mid = ctx.canvas.getAttribute("width") / 2;

  if (option === "face") {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mid, mid, 195, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.stroke();
  }

  if (option === "nose") {
    ctx.beginPath();
    ctx.arc(mid, mid, 15, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "#000000";
    ctx.fill();
  }

}

function getEarliestSunset(lat, lon) {
  var dToday = new Date();
  var monthDayStr = "";
  // Start at the equinox and walk forward toward the winter solstice
  if (lat > 0) {
    monthDayStr = "9/21/";
  } else {
    monthDayStr = "3/21/";
  }
  var dateStr = monthDayStr + d.getFullYear();
  dToday = new Date(dateStr);
  dTomorrow = new Date(dateStr);
  dTomorrow.setDate(dTomorrow.getDate() + 1);
  // As long as the sunset tomorrow is earlier than today, keep going forward in time
  while (getSunsetTime(dToday, lat, lon) > getSunsetTime(dTomorrow, lat, lon)) {
    dTomorrow.setDate(dTomorrow.getDate() + 1);
    dToday.setDate(dToday.getDate() + 1);
  }
  return dToday;
}

function getSunsetTime(d, lat, lon) {
  var sunsetObj = new SunriseSunset(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    lat, lon);
  var tzCorrection = -1 * d.getTimezoneOffset() / 60;
  return sunsetObj.sunsetLocalHours(tzCorrection);
}

function decToHex(val, numDigits) {
  var str = val.toString(16);
  while (str.length < numDigits) {
    str = "0" + str;
  }
  return str
}

function startUp() {
  navigator.geolocation.getCurrentPosition(showTime);
}

function showTime(position) {
  var lat = 0.0;
  var lon = 0.0;
  lat = position.coords.latitude;
  lon = position.coords.longitude;

  var td = new Date();

  var ctx = $('#canvas')[0].getContext("2d");
  drawClockFace(ctx, "face");

  d = new Date();
  var clr = "";
  var val = 0;
  var max = 14;
  var wid = 1;
  for (i = 0; i < max; i++) {
    val = Math.floor(255 * (i / max));
    clr = "#" + decToHex(val, 2) + decToHex(val, 2) + "FF";
    d.setDate(d.getDate() + 1);
    drawMinuteHand(ctx, getSunsetTime(d, lat, lon), clr, wid);
  }

  var sunsetToday = getSunsetTime(td, lat, lon)
  var tm = new Date();
  tm.setDate(tm.getDate() + 1);
  var sunsetTomorrow = getSunsetTime(tm, lat, lon)

  drawMinuteHand(ctx, sunsetToday, "#000000", 6);
  drawHourHand(ctx, sunsetToday);

  drawClockFace(ctx, "nose");

  var earliestSunset = getEarliestSunset(lat, lon);

  var diff = sunsetToday - sunsetTomorrow;
  var daysBetween = Math.floor((earliestSunset - new Date()) / (1000 * 60 * 60 * 24));

  $(".time").html(
    "<table>" +
    "<tr><th colspan='2'>Sunset for " + td.toDateString() + "</th></tr>" +
    "<tr><td>Today</td><td>" + decToHms(sunsetToday) + "</td></tr>" +
    "<tr><td>Tomorrow</td><td>" + decToHms(sunsetTomorrow) + "</td></tr>" +
    "<tr><td>Difference</td><td>" + decToMs(diff) + "</td></tr>" +
    "<tr><th colspan='2'>Earliest Sunset</th></tr>" +
    "<tr><td>Date</td><td>" + earliestSunset.toDateString() + "</td></tr>" +
    "<tr><td>Time</td><td>" + decToHms(getSunsetTime(earliestSunset, lat, lon)) + "</td></tr>" +
    "<tr><td>Days from Now</td><td>" + daysBetween + "</td></tr>" +
    "</table>"
  );

}