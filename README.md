# Leia Inc. WebGL SDK Demo

Leia Inc WebGL SDK for Lume Pad

---

## Prerequisite - Leia Web Helper App
In order to view Lightfield content on the web, you need to install Leia's Web Helper App. This allows communication between browsers and firmware.
Click here to download: https://webbacklight.web.app/backlight_switch_url-release.apk

---

## Getting Started
https://docs.leialoft.com/developer/webgl-sdk/leia-webgl-sdk

---
## Demo : Example 1

To run sample scene:

`npm install` once, then (from example1 dir):

`cd example1`

`npm install` (once)

`npm run build` (once and every time you change src/index.js)

`npm run serve`

Then use displayed address to open the demo.

If you are on macOS, have adb installed, have your device connected you can execute:

`npm run try`

which will do build, serve and will open the demo in Chrome on device.

---
## Known Issues
(canvas).requestFullscreen() is currently unsupported and breaks interlacing effect. Support for this is currently under development.

---
## Acknowledgments:
Thank you to [Jake Downs](https://github.com/jakedowns), who was instrumental in getting integration steps smoothed out!
