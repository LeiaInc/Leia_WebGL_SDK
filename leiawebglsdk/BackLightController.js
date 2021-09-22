import ConfigController from "./ConfigController.js";
import {BacklightMode, BACKLIGHT_URL} from "./Constants.js";

export default  {

    initialise(window, navigator) {
        ConfigController.initialize(window, navigator);
        if(ConfigController.getDisplayConfig()) {
            this.requestBacklightMode(BacklightMode.ON);
        }
        this.registerFocusEvents(window);
    },
    
    getBacklightMode() {
        return this.backlightMode;
    },

    requestBacklightMode(mode) {
        
        let url = BACKLIGHT_URL + mode;

        // Calls android verified app links
        if(this.window) {
            this.window.open(url, "_blank");
            this.backlightMode = mode;
        } else {
            window.open(url, "_blank");
            this.backlightMode = mode;
        }
    },

    getDisplayConfig() {
        return ConfigController.getDisplayConfig();
    },

    registerFocusEvents(window) {
        if(!window) {
            //SDKLogger.logError("Inconsistent window object for registering focus events");
        }

        window.addEventListener('focus', this.onFocus.bind(this));
        window.addEventListener('blur', this.onBlur.bind(this));
    },
    onFocus() {
        // Not captured correctly , App link is redirecting to the HTML page
        //this.requestBacklightMode(Constants.BacklightMode.ON);
    },
    onBlur() {
        // Not captured correctly , App link is redirecting to the HTML page
        //this.requestBacklightMode(Constants.BacklightMode.OFF);
    },
    unregisterFocusEvents(window) {
        window.removeEventListener('focus', this.onFocus.bind(this));
        window.removeEventListener('blur', this.onBlur.bind(this));
    }
}