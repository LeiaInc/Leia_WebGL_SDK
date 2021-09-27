const LoggerPrefix = "Leia-WEBGL-SDK";
module.exports =  {
    logError(message) {
        console.error(LoggerPrefix + " : FATAL : "+message);
    },

    logWarning(message) {
        console.warn(LoggerPrefix + " : WARNING : "+message);
    },

    logMessage(message) {
        console.log(LoggerPrefix + " : LOG : "+message);
    },
}