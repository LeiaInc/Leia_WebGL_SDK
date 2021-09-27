import {DeviceIds, DisplayConfigs, DeviceIdConfigMap } from "./Constants.js";

export default {
    initialize(window, navigator) {
        if(!window || !window.screen || !window.devicePixelRatio) {
            //SDKLogger.logError("Inconsistent window object - screen or devicePixelRatio not found");
        }

        var screen = window.screen;
        var devicePixelRatio = window.devicePixelRatio;
        if(!screen || !screen.width || !screen.height) {
            //SDKLogger.logError("Inconsistent screen object - width or height not found");
        } else {
            var screenWidth = screen.width * devicePixelRatio;
            var screenHeight = screen.height * devicePixelRatio;
        }

        var userAgent = navigator.userAgent;

        for(let i = 0; i < DeviceIds.length; i++) {
            let deviceId = DeviceIds[i];
            if(userAgent.indexOf(deviceId) !== -1) {
                this.displayConfig = DisplayConfigs[DeviceIdConfigMap[deviceId]];
            }
        }

        if(!this.displayConfig) {
            //SDKLogger.logWarning("Unsupported Device");
        }
    },

    getDisplayConfig() {
        return this.displayConfig;
    },

    getDisplayConfigForDevice(deviceId) {
        this.displayConfig = DisplayConfigs[DeviceIdConfigMap[deviceId]];
        return this.displayConfig;
    }
}