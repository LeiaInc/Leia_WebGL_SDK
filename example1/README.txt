This is a spinning textured cube sample scene with LeiaWebGL SDK enabled.

To run the example1, execute npm install in root dir, then cd to example1 and do:

    npm install
    npm run build
    npm run serve

Tap on the page to enable the backlight.

LeiaWebGLSDK in package.json is a local dependency here. If you are going to reuse this code in separate project, remove that line from package.json and do: npm install leiawebglsdk

If you are changing sourcecode of LeiaWebGLSDK in the repo, don't forget to do npm install again in example1 dir (changes would be copied to example1/node_modules).
