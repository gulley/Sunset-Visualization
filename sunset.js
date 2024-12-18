// Initialize the SunsetCalc namespace
const SunsetCalc = {};

const defaultLat = 42.3653766;
const defaultLon = -71.1853512;

SunsetCalc.Sunset = {
    draw: {
        hand: (ctx, angle, color, length, width) => {
            const mid = 200;
            ctx.beginPath();
            ctx.moveTo(mid, mid);
            ctx.lineTo(mid + length * Math.cos(angle), mid + length * Math.sin(angle));
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.stroke();
        },

        minuteHand: (ctx, tIn, color, width) => {
            if (tIn === null) return;
            const hours = Math.floor(tIn);
            const minutes = Math.floor((tIn - hours) * 60);
            let angle = 2 * Math.PI * (tIn - hours);
            angle -= Math.PI / 2;
            const length = 180;
            SunsetCalc.Sunset.draw.hand(ctx, angle, color, length, width);
        },

        hourHand: (ctx, tIn) => {
            if (tIn === null) return;
            let hours = Math.floor(tIn);
            const minutes = Math.floor((tIn - hours) * 60);
            let angle = 2 * Math.PI * ((hours + minutes / 60.0) / 12.0);
            angle -= Math.PI / 2;
            SunsetCalc.Sunset.draw.hand(ctx, angle, "#000000", 100, 10);
        },

        clockFace: (ctx, option) => {
            const mid = ctx.canvas.getAttribute("width") / 2;

            if (option === "face") {
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(mid, mid, 195, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fillStyle = "#FFFFFF";
                ctx.fill();
                ctx.stroke();

                ctx.font = "24px Roboto";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#000";

                const numberRadius = 160;
                for (let i = 1; i <= 12; i++) {
                    const angle = (i * 30) * Math.PI / 180;
                    const x = mid + numberRadius * Math.cos(angle - Math.PI / 2);
                    const y = mid + numberRadius * Math.sin(angle - Math.PI / 2);
                    ctx.fillText(i.toString(), x, y);
                }

                for (let mark = 0; mark < 60; mark++) {
                    const angle = (mark * 6) * Math.PI / 180;
                    const length = (mark % 5 === 0) ? 10 : 5;
                    const innerRadius = 195 - length;
                    const outerRadius = 195;
                    const x1 = mid + innerRadius * Math.cos(angle - Math.PI / 2);
                    const y1 = mid + innerRadius * Math.sin(angle - Math.PI / 2);
                    const x2 = mid + outerRadius * Math.cos(angle - Math.PI / 2);
                    const y2 = mid + outerRadius * Math.sin(angle - Math.PI / 2);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineWidth = (mark % 5 === 0) ? 4 : 1.5;
                    ctx.stroke();
                }
            }

            if (option === "nose") {
                ctx.beginPath();
                ctx.arc(mid, mid, 10, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fillStyle = "#000000";
                ctx.fill();
            }
        }
    },

    dec: {
        toHex: (val, numDigits) => {
            let str = val.toString(16);
            while (str.length < numDigits) {
                str = "0" + str;
            }
            return str;
        },

        toHms: (tIn) => {
            if (tIn === null) return "N/A";
            let hours = Math.floor(tIn);
            const minutes = Math.floor((tIn - hours) * 60);
            const seconds = Math.floor((tIn - hours - minutes / 60) * 60 * 60);
            let pmStr = " AM";
            if (hours > 12) {
                hours -= 12;
                pmStr = " PM";
            } else if (hours === 12) {
                pmStr = " PM";
            } else if (hours === 0) {
                hours = 12;
            }
            return `${hours}:${SunsetCalc.Sunset.pad(minutes)}:${SunsetCalc.Sunset.pad(seconds)}${pmStr}`;
        }
    },

    getEarliestSunset: (lat, lon) => {
        const day = new Date();
        let earliestDay = new Date(day);
        let latestDay = new Date(day);
        let t = 0.0;
        let max = 0.0;
        let min = 24.0;
        for (let i = 0; i < 365; i++) {
            const sunsetTime = SunsetCalc.Sunset.getSunsetTime(day, lat, lon);
            if (sunsetTime !== null) {
                if (sunsetTime < min) {
                    min = sunsetTime;
                    earliestDay = new Date(day);
                } else if (sunsetTime > max) {
                    max = sunsetTime;
                    latestDay = new Date(day);
                }
            }
            day.setDate(day.getDate() + 1);
        }
        return earliestDay;
    },

    getSunsetTime: (d, lat, lon) => {
        const times = SunCalc.getTimes(d, lat, lon);
        const sunsetTimeUTC = times.sunset;
        if (!sunsetTimeUTC) {
            return null;
        }
        const offset = d.getTimezoneOffset() * 60000;
        const sunsetTimeLocal = new Date(sunsetTimeUTC.getTime() - offset);
        const sunsetHours = sunsetTimeLocal.getUTCHours() + sunsetTimeLocal.getUTCMinutes() / 60 + sunsetTimeLocal.getUTCSeconds() / 3600;
        return sunsetHours;
    },

    pad: (n) => (n < 10) ? ("0" + n) : n,

    startUp: () => {
        const storedLat = localStorage.getItem('sunsetLat');
        const storedLon = localStorage.getItem('sunsetLon');
        if (storedLat && storedLon) {
            SunsetCalc.Sunset.showTime(parseFloat(storedLat), parseFloat(storedLon));
        } else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(SunsetCalc.Sunset.setLatLon, SunsetCalc.Sunset.showDefault);
            } else {
                SunsetCalc.Sunset.showDefault();
            }
        }
    },

    showDefault: () => {
        SunsetCalc.Sunset.showTime(defaultLat, defaultLon);
    },

    setLatLon: (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        localStorage.setItem('sunsetLat', lat);
        localStorage.setItem('sunsetLon', lon);
        SunsetCalc.Sunset.showTime(lat, lon);
    },

    showTime: (lat, lon) => {
        const td = new Date();

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        SunsetCalc.Sunset.draw.clockFace(ctx, "face");

        const d = new Date();
        let color = "";
        let val = 0;
        const maxDays = 14;
        const width = 1;
        for (let i = 0; i < maxDays; i++) {
            val = Math.floor(255 * (i / maxDays));
            color = "#" + SunsetCalc.Sunset.dec.toHex(val, 2) + SunsetCalc.Sunset.dec.toHex(val, 2) + "FF";
            d.setDate(d.getDate() + 1);
            const sunsetTime = SunsetCalc.Sunset.getSunsetTime(d, lat, lon);
            if (sunsetTime !== null) {
                SunsetCalc.Sunset.draw.minuteHand(ctx, sunsetTime, color, width);
            }
        }

        const sunsetToday = SunsetCalc.Sunset.getSunsetTime(td, lat, lon);
        const tm = new Date();
        tm.setDate(tm.getDate() + 1);
        const sunsetTomorrow = SunsetCalc.Sunset.getSunsetTime(tm, lat, lon);

        if (sunsetToday !== null) {
            SunsetCalc.Sunset.draw.minuteHand(ctx, sunsetToday, "#000000", 6);
            SunsetCalc.Sunset.draw.hourHand(ctx, sunsetToday);
        }

        const earliestSunset = SunsetCalc.Sunset.getEarliestSunset(lat, lon);
        let diff = 0;
        if (sunsetToday !== null && sunsetTomorrow !== null) {
            diff = Math.abs(sunsetToday - sunsetTomorrow);
        }
        const daysBetween = Math.floor((earliestSunset - new Date()) / (1000 * 60 * 60 * 24)) + 1;

        // Show the earliest sunset time in pink
        const pinkColor = "#FFA0A0";
        SunsetCalc.Sunset.draw.minuteHand(ctx, SunsetCalc.Sunset.getSunsetTime(earliestSunset, lat, lon), pinkColor, width);

        SunsetCalc.Sunset.draw.clockFace(ctx, "nose");

        const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };

        document.querySelector(".time").innerHTML = `
            <div class="sunset-info">
              <div class="current-date">${td.toLocaleDateString('en-US', options)}</div>
              
              <div class="sunset-times">
                <div class="sunset-row">
                  <span>Sunset today</span>
                  <span>${SunsetCalc.Sunset.dec.toHms(sunsetToday)}</span>
                </div>
                <div class="sunset-row">
                  <span>Sunset tomorrow</span>
                  <span>${SunsetCalc.Sunset.dec.toHms(sunsetTomorrow)}</span>
                </div>
                <div class="sunset-row">
                  <span class="difference">difference = ${Math.round(diff * 3600)} sec</span>
                </div>
              </div>
              
              <div class="earliest-sunset">
                There are <span class="days-until-crepusculus">${daysBetween}</span> days until Crepusculus (earliest sunset of the year).<br>
                It will occur at <span class="earliest-sunset-time">${SunsetCalc.Sunset.dec.toHms(SunsetCalc.Sunset.getSunsetTime(earliestSunset, lat, lon))}</span> on <span class="earliest-sunset-date">${earliestSunset.toLocaleDateString('en-US', options)}</span>
              </div>
            </div>`;
    }
};