This is a spinning textured cube sample scene with LeiaWebGL SDK enabled.

To run the example1, execute `npm install` in root dir, then cd to example1 and do:

    `npm install` (once)
    `npm run build` (once and every time you change src/index.js)
    `npm run serve`

Then use displayed address to open the demo.

If you are on macOS, have adb installed, have your device connected you can execute:

`npm run try`

which will do build, serve and will open the demo in Chrome on device.

Tap on the page to enable the backlight.

LeiaWebGLSDK in package.json is a local dependency here. If you are going to reuse this code in separate project, remove that line from package.json and do: npm install leiawebglsdk

If you are changing sourcecode of LeiaWebGLSDK in the repo, don't forget to do npm install again in example1 dir (changes would be copied to example1/node_modules).
