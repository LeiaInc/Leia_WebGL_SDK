Instructions for development from a Windows environment.

1. Install VS Code
2. Start VS Code, click the 'Extensions' button, and install the 'Live Server' extension. It will add a button to the status bar.
3. Start Live Server by clicking the button in the status bar, and take note of the port number (default = 5500)

4. Debugging on Windows
     - There is no support for backlight switching on Windows yet. Until support is available, you must comment-out lines that reference the BackLightController variable. Despite no backlight, everything else should work as expected.
     - From 'Run and Debug', select 'Launch Chrome/Edge against localhost.'
   
5. Running on LumePad
     - Ensure both your Windows and LumeTab systems are on the same WiFi connection.
     - From Windows: 
          - Open a command-prompt, run "ipconfig" and take note of the IPV4 address.
          - Ensure the Live Server is running in VS Code.
     - From LumeTab: Start Chrome and add the Live Server port number to the IPV4 address (e.g. 192.168.2.163:5500) and enter it into the address bar.
