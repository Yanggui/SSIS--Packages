const getCustomGoodModule = function (name) {
    return `${__dirname}/${name}`;
};

const getResponseFilterModuleConfig = function (showError) {
    return {
        module: getCustomGoodModule("response-filter"),
        args: [{showError}]
    };
};

const getStreamModuleConfig = function (stream) {

    const writeStream = function () {
    };

    writeStream.prototype = stream;

    return {
        module: writeStream
    };
};

const getSqueezeModuleConfig = function (argValues) {
    return {
        module: "good-squeeze",
        name: "Squeeze",
        args: [argValues]
    };
};

const getInfoFileReporter = function (stdout) {
    return [
        getSqueezeModuleConfig({ log: ["info", "debug"], response: "*", format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        getResponseFilterModuleConfig(false),
        getStreamModuleConfig(stdout)
    ];
};

const getErrorFileReporter = function (stderr) {
    return [
        getSqueezeModuleConfig({log: "error", error: "*", request: "error", "response": "*" }),
        getResponseFilterModuleConfig(true),
        getStreamModuleConfig(stderr)
    ];
};

const goodOptions = function (log) {
    return {
        reporters: {
            infoFileReporter: getInfoFileReporter(log.stdout),
            errorFileReporter: getErrorFileReporter(log.stderr)
        }
    };
};

const getGoodConfig = function (log) {
    return goodOptions(log);
};

module.exports = getGoodConfig;