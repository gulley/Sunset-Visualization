function decToHms(tIn) {
  var hours = Math.floor(tIn);
  var minutes = Math.floor((tIn - hours)*60);
  var seconds = Math.floor((tIn - hours - minutes/60)*60*60);
  return hours + ":" + pad(minutes) + ":" + pad(seconds);
}

function decToMs(tIn) {
  var minutes = Math.floor(tIn*60);
  var seconds = Math.floor((tIn - minutes/60)*60*60);
  return minutes + ":" + pad(seconds);
}

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function drawHand(ctx,angle,color,type) {
  var len = 0;
  var wid = 0;
  var mid = 200;
  if (type==0) {
    // Minute hand
    len = 180;
    wid = 4;
  } else if (type==1) {
    // Hour hand
    len = 100;
    wid = 8;
  }
  ctx.beginPath();
  ctx.moveTo(mid, mid);
  ctx.lineTo(mid+len*Math.cos(angle), mid+len*Math.sin(angle));
  ctx.lineWidth = wid;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawMinuteHand(ctx,tIn,color) {
  var hours = Math.floor(tIn);
  var minutes = Math.floor((tIn - hours)*60);
  var angle = 2*Math.PI*(tIn - hours);
  // Correct for the fact that east corresponds to 0 degrees, whereas north is 12:00
  angle -= Math.PI/2;
  drawHand(ctx,angle,color,0)
}

function drawHourHand(ctx,tIn) {
  var hours = Math.floor(tIn);
  var minutes = Math.floor((tIn - hours)*60);
  var angle = 2*Math.PI*((hours + minutes/60.0)/12.0);
  // Correct for the fact that east corresponds to 0 degrees, whereas north is 12:00
  angle -= Math.PI/2;
  drawHand(ctx,angle,"#000000",1)
}

function drawClockFace(ctx) {
  // Draw the circle to make the clock face
  var mid = 200;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mid, mid, 195, 0, Math.PI*2, true); 
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(mid, mid, 10, 0, Math.PI*2, true); 
  ctx.closePath();
  ctx.fillStyle = "#000000";
  ctx.fill();
  
}

function getSunsetTime(d,lat,lon) {
  var sunsetObj = new SunriseSunset(
    d.getFullYear(), 
    d.getMonth()+1, 
    d.getDate(), 
    lat, lon);
  var tzCorrection = -1*d.getTimezoneOffset()/60;
  return sunsetObj.sunsetLocalHours(tzCorrection); 
}


function showTime() {
  var lat = 42.363339;
  var lon = -71.192136;
  var d = new Date();
 
  var ctx = $('#canvas')[0].getContext("2d");
  drawClockFace(ctx);

  var sunsetToday = getSunsetTime(d,lat,lon) 
  drawHourHand(ctx,sunsetToday);
  drawMinuteHand(ctx,sunsetToday);
  d.setDate(d.getDate()+1);
  var sunsetTomorrow = getSunsetTime(d,lat,lon) 
  
  d.setDate(d.getDate()+1);
  drawMinuteHand(ctx,getSunsetTime(d,lat,lon),"#E0E0E0");
  d.setDate(d.getDate()+1);
  drawMinuteHand(ctx,getSunsetTime(d,lat,lon),"#B0B0B0");
  d.setDate(d.getDate()+1);
  drawMinuteHand(ctx,sunsetTomorrow,"#808080");
  drawMinuteHand(ctx,sunsetToday,"#000000");

  var diff = sunsetToday - sunsetTomorrow;
    $(".time").html(
      "<table>" +
      "<tr><th colspan='2'>Sunset for " + d.toDateString() + "</th></tr>" +
      "<tr><td>Today</td><td>" + decToHms(sunsetToday) + "</td></tr>" + 
      "<tr><td>Tomorrow</td><td>" + decToHms(sunsetTomorrow) + "</td></tr>" + 
      "<tr><td>Difference</td><td>" + decToMs(diff) + "</td></tr>" +
      "</table>"
    );  

}
