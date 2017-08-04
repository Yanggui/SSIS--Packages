"use strict";
const _ = require("lodash");

const readEnvValue = function (key) {
    const e = process.env;
    const value = e[key];
    if (_.isNil(value)) {
        global.logger.error(`Environment variable ${key} is missing`);
    }
    return value;
};

const readIntegerEnvValue = function (key, defaultValue) {
    let value = readEnvValue(key);
    if (value) {
        value = parseInt(value);
        if (!isNaN(value)) {
            return value;
        }
    }
    return defaultValue;
};

const readBoolEnvValue = function (key) {
    const value = readEnvValue(key);
    return value === "true" ? true : false;
};


module.exports = {readEnvValue, readIntegerEnvValue, readBoolEnvValue};