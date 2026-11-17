# Sunset Times

A countdown to Crepusculus, the earliest sunset of the year. The page shows
today's sunset on a clock face, with lines for the next two weeks of sunsets
and the earliest sunset of the year.

A working version of this page is deployed here:

[Sunset Times](https://gulley.github.io/Sunset-Visualization/)

## Running it locally

The page uses JavaScript modules, so it has to be served over HTTP; opening
`index.html` directly from disk won't work. Use VS Code's Live Server
(configured for port 5501) or any static file server.

## Files

- `index.html` – page markup
- `styles.css` – layout, theme colours and dark mode
- `calc.js` – sunset calculations and time formatting (no DOM access)
- `clock.js` – draws the clock face and hands on a canvas
- `main.js` – picks the location, runs the calculations and renders the page
- `favicon.svg` – browser tab icon

Sunset times come from the [SunCalc](https://github.com/mourner/suncalc)
library, loaded from cdnjs.

## To do
- Add option to show either sunrise or sunset times

## Done
- Put in a pink line to show the day of the earliest sunset
- Make sure the times match the geo-located position
- Clean up table at the bottom
- Use the SunCalc library instead of the current (very old) one
- Remove Material Design Lite; split the code into modules
- Fix the days-until count, sunset time zone handling, and stale saved location
- Redesign: dusk palette, dark mode, classic clock face, compact layout
- Show which location is in use, with a link to it on Google Maps
- Refresh the page when the day changes
