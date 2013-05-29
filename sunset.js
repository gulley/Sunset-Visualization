// TODO
// Get rid of all the old writeln stuff. Replace with jQuery actions.
// Separate calculations from UI management.


// UI Interactions
// ----------------------------------------------
function latlongChanged() {
    calculate();
}


function inputsChanged() {
    calculate();
}
// ----------------------------------------------




// Form-handling code
// ----------------------------------------------

function isNumber(inputVal) {
  var oneDecimal = false;
  var inputStr = "" + inputVal;
  for (var i = 0; i < inputStr.length; i++)
 {
    var oneChar = inputStr.charAt(i);
    if (i == 0 && (oneChar == "-" || oneChar == "+"))
 {
      continue;
    }
    if (oneChar == "." && !oneDecimal)
 {
      oneDecimal = true;
      continue;
    }
    if (oneChar < "0" || oneChar > "9")
 {
      return false;
    }
  }
  return true;
}


function zeroPad(n, digits) {
  n = n.toString();
  while (n.length < digits) {
    n = '0' + n;
  }
  return n;
}


function month(name, numdays, abbr) {
  this.name = name;
  this.numdays = numdays;
  this.abbr = abbr;
}


var monthList = new Array();
var i = 0;
monthList[i++] = new month("January",   31, "Jan");
monthList[i++] = new month("February",  28, "Feb");
monthList[i++] = new month("March",     31, "Mar");
monthList[i++] = new month("April",     30, "Apr");
monthList[i++] = new month("May",       31, "May");
monthList[i++] = new month("June",      30, "Jun");
monthList[i++] = new month("July",      31, "Jul");
monthList[i++] = new month("August",    31, "Aug");
monthList[i++] = new month("September", 30, "Sep");
monthList[i++] = new month("October",   31, "Oct");
monthList[i++] = new month("November",  30, "Nov");
monthList[i++] = new month("December",  31, "Dec");

// ----------------------------------------------

function getJDFromDatePicker() {
  var theDate = $("#datepicker").datepicker("getDate");
  return getJD(theDate);
}


function getJD(theDate) {
  // Get Julian Date 
  // Use this reference http://aa.usno.navy.mil/data/docs/JulianDate.php

  var docmonth = theDate.getMonth() + 1;
  var docday   = theDate.getDate();
  var docyear  = theDate.getFullYear();

  if (docmonth <= 2) {
    docyear -= 1;
    docmonth += 12;
  }

  var A = Math.floor(docyear/100);
  var B = 2 - A + Math.floor(A/4);
  var JD = Math.floor(365.25*(docyear + 4716)) + Math.floor(30.6001*(docmonth+1)) + docday + B - 1524.5;
  return JD;

}


function getTimeLocal() {
   // Get Local Time
   var dochr = parseInt($("#hrbox").attr("value"));
   var docmn = parseInt($("#mnbox").attr("value"));
   var docsc = parseInt($("#scbox").attr("value"));
   var docpm = $("#pmbox").is(':checked');
   var docdst = $("#dstCheckbox").is(':checked');
   if ( (docpm) && (dochr < 12) ) {
      dochr += 12
   }
   if (docdst) {
      dochr -= 1
   }
   var mins = dochr * 60 + docmn + docsc/60.0
   return mins
}


function calcAzEl(output, T, localtime, latitude, longitude, zone) {
   // Calculate Azimuth and Elevation of the sun
   var eqTime = calcEquationOfTime(T)
   var theta  = calcSunDeclination(T)
   if (output) {
      document.getElementById("eqtbox").value = Math.floor(eqTime*100 +0.5)/100.0
      document.getElementById("sdbox").value = Math.floor(theta*100+0.5)/100.0
   }
   var solarTimeFix = eqTime + 4.0 * longitude - 60.0 * zone
  var earthRadVec = calcSunRadVector(T)
  var trueSolarTime = localtime + solarTimeFix
  while (trueSolarTime > 1440) {
    trueSolarTime -= 1440
  }
  var hourAngle = trueSolarTime / 4.0 - 180.0;
  if (hourAngle < -180) {
    hourAngle += 360.0
  }
  var haRad = degToRad(hourAngle)
  var csz = Math.sin(degToRad(latitude)) * Math.sin(degToRad(theta)) + Math.cos(degToRad(latitude)) * Math.cos(degToRad(theta)) * Math.cos(haRad)
  if (csz > 1.0) {
    csz = 1.0
  } else if (csz < -1.0) {
    csz = -1.0
  }
  var zenith = radToDeg(Math.acos(csz))
  var azDenom = ( Math.cos(degToRad(latitude)) * Math.sin(degToRad(zenith)) )
  if (Math.abs(azDenom) > 0.001) {
    azRad = (( Math.sin(degToRad(latitude)) * Math.cos(degToRad(zenith)) ) - Math.sin(degToRad(theta))) / azDenom
    if (Math.abs(azRad) > 1.0) {
      if (azRad < 0) {
   azRad = -1.0
      } else {
   azRad = 1.0
      }
    }
    var azimuth = 180.0 - radToDeg(Math.acos(azRad))
    if (hourAngle > 0.0) {
      azimuth = -azimuth
    }
  } else {
    if (latitude > 0.0) {
      azimuth = 180.0
    } else {
      azimuth = 0.0
    }
  }
  if (azimuth < 0.0) {
    azimuth += 360.0
  }
  var exoatmElevation = 90.0 - zenith

   // Atmospheric Refraction correction

  if (exoatmElevation > 85.0) {
    var refractionCorrection = 0.0;
  } else {
    var te = Math.tan (degToRad(exoatmElevation));
    if (exoatmElevation > 5.0) {
      var refractionCorrection = 58.1 / te - 0.07 / (te*te*te) + 0.000086 / (te*te*te*te*te);
    } else if (exoatmElevation > -0.575) {
      var refractionCorrection = 1735.0 + exoatmElevation * (-518.2 + exoatmElevation * (103.4 + exoatmElevation * (-12.79 + exoatmElevation * 0.711) ) );
    } else {
      var refractionCorrection = -20.774 / te;
    }
    refractionCorrection = refractionCorrection / 3600.0;
  }

  var solarZen = zenith - refractionCorrection;

  if ((output) && (solarZen > 108.0) ) {
    document.getElementById("azbox").value = "dark"
    document.getElementById("elbox").value = "dark"
  } else if (output) {
    document.getElementById("azbox").value = Math.floor(azimuth*100 +0.5)/100.0
    document.getElementById("elbox").value = Math.floor((90.0-solarZen)*100+0.5)/100.0
  }
  return (azimuth)
}


function calcSolNoon(jd, longitude, timezone, dst) {
   var tnoon = calcTimeJulianCent(jd - longitude/360.0)
   var eqTime = calcEquationOfTime(tnoon)
   var solNoonOffset = 720.0 - (longitude * 4) - eqTime // in minutes
   var newt = calcTimeJulianCent(jd + solNoonOffset/1440.0)
   eqTime = calcEquationOfTime(newt)
   solNoonLocal = 720 - (longitude * 4) - eqTime + (timezone*60.0)// in minutes
   if(dst) solNoonLocal += 60.0
   while (solNoonLocal < 0.0) {
      solNoonLocal += 1440.0;
   }
   while (solNoonLocal >= 1440.0) {
      solNoonLocal -= 1440.0;
   }
   document.getElementById("noonbox").value = timeString(solNoonLocal, 3)
}


function dayString(jd, next, flag) {
// returns a string in the form DDMMMYYYY[ next] to display prev/next rise/set
// flag=2 for DD MMM, 3 for DD MM YYYY, 4 for DDMMYYYY next/prev
  if ((jd < 900000) || (jd > 2817000)) {
    var output = "error"
  } else {
  var z = Math.floor(jd + 0.5);
  var f = (jd + 0.5) - z;
  if (z < 2299161) {
    var A = z;
  } else {
    alpha = Math.floor((z - 1867216.25)/36524.25);
    var A = z + 1 + alpha - Math.floor(alpha/4);
  }
  var B = A + 1524;
  var C = Math.floor((B - 122.1)/365.25);
  var D = Math.floor(365.25 * C);
  var E = Math.floor((B - D)/30.6001);
  var day = B - D - Math.floor(30.6001 * E) + f;
  var month = (E < 14) ? E - 1 : E - 13;
  var year = ((month > 2) ? C - 4716 : C - 4715);
  if (flag == 2)
    var output = zeroPad(day,2) + " " + monthList[month-1].abbr;
  if (flag == 3)
    var output = zeroPad(day,2) + monthList[month-1].abbr + year.toString();
  if (flag == 4)
    var output = zeroPad(day,2) + monthList[month-1].abbr + year.toString() + ((next) ? " next" : " prev");
  }
  return output;
}


function timeDateString(JD, minutes) {
    var output = timeString(minutes, 2) + " " + dayString(JD, 0, 2);
    return output;
}


function timeString(minutes, flag) {
    // timeString returns a zero-padded string (HH:MM:SS) given time in minutes
    // flag=2 for HH:MM, 3 for HH:MM:SS {

    if ((minutes >= 0) && (minutes < 1440)) {
        var floatHour = minutes / 60.0;
        var hour = Math.floor(floatHour);
        var floatMinute = 60.0 * (floatHour - Math.floor(floatHour));
        var minute = Math.floor(floatMinute);
        var floatSec = 60.0 * (floatMinute - Math.floor(floatMinute));
        var second = Math.floor(floatSec + 0.5);
        if (second > 59) {
            second = 0
            minute += 1
        }
        if ((flag == 2) && (second >= 30)) minute++;
        if (minute > 59) {
            minute = 0
            hour += 1
        }
        var output = zeroPad(hour,2) + ":" + zeroPad(minute,2);
        if (flag > 2) {
            output = output + ":" + zeroPad(second,2);              
        }
    } else {
            var output = "error"
    }
    return output;
}


function calcSunriseSetUTC(rise, JD, latitude, longitude) {
    var t = calcTimeJulianCent(JD);
    var eqTime = calcEquationOfTime(t);
    var solarDec = calcSunDeclination(t);
    var hourAngle = calcHourAngleSunrise(latitude, solarDec);
    if (!rise) hourAngle = -hourAngle;
    var delta = longitude + radToDeg(hourAngle);
    var timeUTC = 720 - (4.0 * delta) - eqTime;   // in minutes
    return timeUTC
}


function calcSunriseSet(rise, JD, latitude, longitude, timezone, dst) {
    // rise = 1 for sunrise, 0 for sunset
    var id = ((rise) ? "risebox" : "setbox")
    var timeUTC = calcSunriseSetUTC(rise, JD, latitude, longitude);
    var newTimeUTC = calcSunriseSetUTC(rise, JD + timeUTC/1440.0, latitude, longitude);
    if (isNumber(newTimeUTC)) {
        var timeLocal = newTimeUTC + (timezone * 60.0)
        timeLocal += ((dst) ? 60.0 : 0.0);
        if ((timeLocal >= 0.0) && (timeLocal < 1440.0)) {
            var spanId = ((rise)? "#sunrise":"#sunset");
            $(spanId).html(timeString(timeLocal,2));
        } else {
            var jday = JD
            var increment = ((timeLocal < 0) ? 1 : -1)
            while ((timeLocal < 0.0)||(timeLocal >= 1440.0)) {
                timeLocal += increment * 1440.0
                jday -= increment
            }
            document.getElementById(id).value = timeDateString(jday,timeLocal)
        }
    } else {
        // no sunrise/set found
        var doy = calcDoyFromJD(JD)
        if (((latitude >  66.4) &&  (doy > 79) && (doy < 267)) ||
            ((latitude < -66.4) && ((doy < 83) || (doy > 263))) ) {
            //previous sunrise/next sunset
            if (rise) {
                // find previous sunrise
                jdy = calcJDofNextPrevRiseSet(0, rise, JD, latitude, longitude, timezone, dst)
            } else {
                // find next sunset
                jdy = calcJDofNextPrevRiseSet(1, rise, JD, latitude, longitude, timezone, dst)
            }
            document.getElementById(((rise)? "risebox":"setbox")).value = dayString(jdy,0,3)
        } else {
            //previous sunset/next sunrise
            if (rise == 1) {
                // find previous sunrise
                jdy = calcJDofNextPrevRiseSet(1, rise, JD, latitude, longitude, timezone, dst)
            } else {
                // find next sunset
                jdy = calcJDofNextPrevRiseSet(0, rise, JD, latitude, longitude, timezone, dst)
            }
            document.getElementById(((rise)? "risebox":"setbox")).value = dayString(jdy,0,3)
        }
    }
}


function calcJDofNextPrevRiseSet(next, rise, JD, latitude, longitude, tz, dst) {
    var julianday = JD;
    var increment = ((next) ? 1.0 : -1.0);

    var time = calcSunriseSetUTC(rise, julianday, latitude, longitude);
    while(!isNumber(time)){
        julianday += increment;
        time = calcSunriseSetUTC(rise, julianday, latitude, longitude);
    }
    var timeLocal = time + tz * 60.0 + ((dst) ? 60.0 : 0.0)
    while ((timeLocal < 0.0) || (timeLocal >= 1440.0)) {
        var incr = ((timeLocal < 0) ? 1 : -1)
        timeLocal += (incr * 1440.0)
        julianday -= incr
    }
    return julianday;
}


function clearOutputs() {
    $("#eqtbox").attr("value","");
    $("#sdbox").attr("value","");
    $("#risebox").attr("value","");
    $("#noonbox").attr("value","");
    $("#setbox").attr("value","");
    $("#azbox").attr("value","");
    $("#elbox").attr("value","");
}


function calculate() {
    var jday = getJDFromDatePicker()
    var tl = getTimeLocal()
    var tz = parseInt($("#zonebox").attr("value"));
    var dst = $("#dstCheckbox").is(':checked');

    var total = jday + tl/1440.0 - tz/24.0
    var T = calcTimeJulianCent(total)
    var lat = parseFloat(document.getElementById("latbox").value.substring(0,9))
    var lng = parseFloat(document.getElementById("lngbox").value.substring(0,10))
    calcAzEl(1, T, tl, lat, lng, tz)
    calcSolNoon(jday, lng, tz, dst)
    var rise = calcSunriseSet(1, jday, lat, lng, tz, dst)
    var set  = calcSunriseSet(0, jday, lat, lng, tz, dst)
}


function earliestSunset() {
    var jday = getJDFromDatePicker()
    var lat = parseFloat(document.getElementById("latbox").value.substring(0,9))
    var lng = parseFloat(document.getElementById("lngbox").value.substring(0,10))

    var set     = calcSunriseSetUTC(0, jday, lat, lng)
    var jdayNew = jday + 1
    var setNew  = calcSunriseSetUTC(0, jdayNew, lat, lng)

    while (set < setNew) {
        jday = jdayNew
        jdayNew = jday + 1
        set = setNew
        setNew  = calcSunriseSetUTC(0, jdayNew, lat, lng)
    }

    return timeString(set)
}
