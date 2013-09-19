// requires jQuery

var SC = SC || {};

SC.Sunset = {
  
  draw : {
    hand : function(ctx, angle, color, length, width) {
        var mid = 200;
        ctx.beginPath();
        ctx.moveTo(mid, mid);
        ctx.lineTo(mid + length * Math.cos(angle), mid + length * Math.sin(angle));
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
    },

    minuteHand : function(ctx, tIn, color, width) {
      var hours = Math.floor(tIn);
      var minutes = Math.floor((tIn - hours) * 60);
      var angle = 2 * Math.PI * (tIn - hours);
      // Correct for the fact that east corresponds to 0 degrees, whereas north is 12:00
      angle -= Math.PI / 2;
      var length = 180;
      SC.Sunset.draw.hand(ctx, angle, color, length, width);
    },

    hourHand : function(ctx, tIn, color, width) {
      var hours = Math.floor(tIn);
      var minutes = Math.floor((tIn - hours) * 60);
      var angle = 2 * Math.PI * ((hours + minutes / 60.0) / 12.0);
      // Correct for the fact that east corresponds to 0 degrees, whereas north is 12:00
      angle -= Math.PI / 2;
      SC.Sunset.draw.hand(ctx, angle, "#000000", 100, 10);
    },

    clockFace : function(ctx, option) {
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
  },

  dec : {
  
    toHex : function(val, numDigits) {
      var str = val.toString(16);
      while (str.length < numDigits) {
        str = "0" + str;
      }
      return str
    },

    toHms : function(tIn) {
      var hours = Math.floor(tIn);
      var minutes = Math.floor((tIn - hours) * 60);
      var seconds = Math.floor((tIn - hours - minutes / 60) * 60 * 60);
      if (hours > 12) {
        hours -= 12;
      }
      return hours + ":" + SC.Sunset.pad(minutes) + ":" + SC.Sunset.pad(seconds);
    },

    toMs : function(tIn) {
      var minutes = Math.floor(tIn * 60);
      var seconds = Math.floor((tIn - minutes / 60) * 60 * 60);
      return minutes + ":" + SC.Sunset.pad(seconds);
    }

  },

  getEarliestSunset : function(lat, lon) {
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
    while (SC.Sunset.getSunsetTime(dToday, lat, lon) > SC.Sunset.getSunsetTime(dTomorrow, lat, lon)) {
      dTomorrow.setDate(dTomorrow.getDate() + 1);
      dToday.setDate(dToday.getDate() + 1);
    }
    return dToday;
  },

  getSunsetTime : function(d, lat, lon) {
    var sunsetObj = new SunriseSunset(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      lat, lon);
    var tzCorrection = -1 * d.getTimezoneOffset() / 60;
    return sunsetObj.sunsetLocalHours(tzCorrection);
  },

  pad : function(n) {
    return (n < 10) ? ("0" + n) : n;
  },

  startUp : function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(SC.Sunset.setLatLon);
    } else {
      var lat = 42.0;
      var lon = -71.2;
      SC.Sunset.showTime(lat,lon);
    }
  },

  setLatLon : function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    SC.Sunset.showTime(lat,lon);
  },

  showTime : function(lat,lon) {
    var td = new Date();

    var ctx = $('#canvas')[0].getContext("2d");
    SC.Sunset.draw.clockFace(ctx, "face");

    d = new Date();
    var clr = "";
    var val = 0;
    var max = 14;
    var wid = 1;
    for (i = 0; i < max; i++) {
      val = Math.floor(255 * (i / max));
      clr = "#" + SC.Sunset.dec.toHex(val, 2) + SC.Sunset.dec.toHex(val, 2) + "FF";
      d.setDate(d.getDate() + 1);
      SC.Sunset.draw.minuteHand(ctx, SC.Sunset.getSunsetTime(d, lat, lon), clr, wid);
    }

    var sunsetToday = SC.Sunset.getSunsetTime(td, lat, lon)
    var tm = new Date();
    tm.setDate(tm.getDate() + 1);
    var sunsetTomorrow = SC.Sunset.getSunsetTime(tm, lat, lon)

    SC.Sunset.draw.minuteHand(ctx, sunsetToday, "#000000", 6);
    SC.Sunset.draw.hourHand(ctx, sunsetToday);

    SC.Sunset.draw.clockFace(ctx, "nose");

    var earliestSunset = SC.Sunset.getEarliestSunset(lat, lon);

    var diff = sunsetToday - sunsetTomorrow;
    var daysBetween = Math.floor((earliestSunset - new Date()) / (1000 * 60 * 60 * 24));

    $(".time").html(
      "<table>" +
      "<tr><th colspan='2'>" + "Sunset for " + td.toDateString() + " " + 
      "<a href='https://www.google.com/maps/?q=" + lat + "," + lon + "'>" + "Here</a></th></tr>" +
      "<tr><td>Today</td><td>" + SC.Sunset.dec.toHms(sunsetToday) + "</td></tr>" +
      "<tr><td>Tomorrow</td><td>" + SC.Sunset.dec.toHms(sunsetTomorrow) + "</td></tr>" +
      "<tr><td>Difference</td><td>" + SC.Sunset.dec.toMs(diff) + "</td></tr>" +
      "<tr><th colspan='2'>Earliest Sunset</th></tr>" +
      "<tr><td>Date</td><td>" + earliestSunset.toDateString() + "</td></tr>" +
      "<tr><td>Time</td><td>" + SC.Sunset.dec.toHms(SC.Sunset.getSunsetTime(earliestSunset, lat, lon)) + "</td></tr>" +
      "<tr><td>Days from Now</td><td>" + daysBetween + "</td></tr>" +
      "</table>");
    }
}