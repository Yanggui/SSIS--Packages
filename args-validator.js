const _ = require("lodash");

const validateBool = (value, paramName, widgetId) => {
    if (!_.isBoolean(value)) {
        global.logger.error(`Widget '${widgetId}': Parameter ${paramName} is not a boolean.`);
    }
};

const validateString = (value, paramName, widgetId) => {
    if (!_.isString(value)) {
        global.logger.error(`Widget '${widgetId}': Parameter ${paramName} is not a string.`);
    }
};

const validateNumber = (value, paramName, widgetId) => {
    if (!_.isNumber(value)) {
        global.logger.error(`Widget '${widgetId}': Parameter ${paramName} is not a number.`);
    }
};

const validateArgs = function (app, args) {
    const paramTypes = app.paramTypes;
    if (!paramTypes) {
        return;
    }

    const widgetId = app.id;

    for (const paramName in paramTypes) {
        const typeInfo = paramTypes[paramName];
        if (!typeInfo) {
            global.logger.error(`Widget '${widgetId}': ${paramName} not declared in paramTypes of widget`);
            continue;
        }

        const value = args[paramName];
        if (_.isNil(value)) {
            if (typeInfo.required) {
                global.logger.error(`Widget '${widgetId}': ${paramName} is required`);
            }
            continue;
        }

        switch (typeInfo.type) {
            case "bool":
                validateBool(value, paramName, widgetId);
                break;
            case "string":
                validateString(value, paramName, widgetId);
                break;
            case "number":
                validateNumber(value, paramName, widgetId);
                break;
            default:
                break;
        }
    }
};

module.exports = validateArgs;