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

function showTime() {
  // Sunset algorithm courtesy of http://prestonhunt.com/story/124
  var lat = 42.363339;
  var lon = -71.192136;
  var d = new Date();
  var today = new SunriseSunset(
    d.getFullYear(), 
    d.getMonth()+1, 
    d.getDate(), 
    lat, lon);
  var tomorrow = new SunriseSunset(
    d.getFullYear(), 
    d.getMonth()+1, 
    d.getDate()+1, 
    lat, lon);
  var sunsetToday    = today.sunsetLocalHours(-1*d.getTimezoneOffset()/60);
  var sunsetTomorrow = tomorrow.sunsetLocalHours(-1*d.getTimezoneOffset()/60);
  var diff = sunsetToday - sunsetTomorrow;
  jQuery(".time").html(
      "<table>" +
      "<tr><th colspan='2'>Sunset for " + d.toDateString() + "</th></tr>" +
      "<tr><td>Today</td><td>" + decToHms(sunsetToday) + "</td></tr>" + 
      "<tr><td>Tomorrow</td><td>" + decToHms(sunsetTomorrow) + "</td></tr>" + 
      "<tr><td>Difference</td><td>" + decToMs(diff) + "</td></tr>" +
      "</table>"
    );  
}
