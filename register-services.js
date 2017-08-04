"use strict";
const fs = require("fs");
const Path = require("path");
const _ = require("lodash");
const {contextManager} = require("mdc-utils");
const config = require("../config");
//const hasPermissions = require("./permissions/permission-checker");

const CODE_BAD_REQUEST = 400;
const CODE_UNAUTHORIZED = 401;
//const CODE_FORBIDDEN = 403;
const CODE_INTERNAL_ERROR = 500;

const isDev = config.server.debug;

global.services = {};

const buildErrorResult = (code, message) => {
    return {success: false, error: {code, message}};
};

const executeService = (ServiceClass, args, contextId) => {
    const service = new ServiceClass(contextId);
    return service.execute(...args);
};

const validateArgs = (args, name) => {
    if (!isDev) {
        return true;
    }

    // Prevent client rendering and server rendering args not consistent
    const convertedData = JSON.parse(JSON.stringify(args));
    if (!_.isEqual(args, convertedData)) {
        global.logger.error(`Service ${name}'s execute() has arguments with forbidden data types.`);
        return false;
    }

    return true;
};

const createInternalErrorResult = (err) => {
    global.logger.error(err);
    let message = "Internal error, please see error logs.";
    if (err.hasOwnProperty("message")) {
        message = `${err.message}. For more information, please see error logs.`;
    }
    return Promise.resolve(buildErrorResult(CODE_INTERNAL_ERROR, message));
};

/* eslint consistent-return: 0 */
const wrapService = (apiConfig) => {
    if (!apiConfig || !apiConfig.hasOwnProperty("service")) {
        return null;
    }

    const service = apiConfig.service;
    let permissions = apiConfig.permissions;
    if (_.isNil(permissions) || _.isEmpty(permissions)) {
        permissions = {anonymous: false};
    }

    const wrappedService = (args, contextId) => {
        if (!validateArgs(args, apiConfig.name)) {
            return Promise.resolve(buildErrorResult(CODE_BAD_REQUEST,
                "Bad Data: Request data is invalid. Please find error logs for more detail."));
        }
        let context = contextManager.getContext(contextId);
        if (_.isNil(context)) {
            context = {request: {auth: {isAuthenticated: false}}, reply: null};
        }
        const request = context.request;
        const auth = request.auth;
        const isAuthenticated = auth.isAuthenticated;
        if (!permissions.anonymous && !isAuthenticated) {
            return Promise.resolve(buildErrorResult(CODE_UNAUTHORIZED,
                "Unauthorized: User not logged in or passed a wrong contextId."));
        }

        return Promise.resolve(executeService(service, args, contextId));

/*        if (isAuthenticated) {
            return hasPermissions(permissions, request).then((value) => {
                if (value !== true) {
                    return buildErrorResult(CODE_FORBIDDEN, "Forbidden");
                }
                return executeService(service, args, contextId);
            });
        } else {
            return executeService(service, args, contextId);
        }*/
    };

    return (args, contextId) => {
        let resultPromise = null;
        try {
            resultPromise = wrappedService(args, contextId);
        } catch (err) {
            return createInternalErrorResult(err);
        }

        return resultPromise.catch(createInternalErrorResult);
    };
};

const getJsonFile = function (path) {
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, "utf8");
        return JSON.parse(data);
    }

    return null;
};

const getPackageName = function (dirname) {
    const jsonFile = getJsonFile(Path.join(dirname, "package.json"));
    if (!jsonFile) {
        global.logger.error(`Cannot find ${jsonFile}`);
        return null;
    }

    return jsonFile.name;
};

const getServiceModules = (hostDir) => {
    const modules = fs.readdirSync(Path.join(hostDir, "node_modules"));
    const result = [];
    modules.forEach((m) => {
        m = m.toLowerCase();
        if (m.indexOf("mdc-") === 0) {
            const packagePath = Path.join(hostDir, "node_modules", m);
            const packageName = getPackageName(packagePath);
            const serviceIndexPath = Path.join(packagePath, "lib", "src", "services", "index.js");
            if (fs.existsSync(serviceIndexPath)) {
                /* eslint global-require: 0 */
                let serviceIndexModule = require(serviceIndexPath);
                if (serviceIndexModule.hasOwnProperty("default")) {
                    serviceIndexModule = serviceIndexModule.default;
                }
                result.push({name: packageName, serviceIndexModule});
            }
        }
    });
    return result;
};

const registerService = (serviceInfo) => {
    const featureName = serviceInfo.name;
    const serviceIndexModule = serviceInfo.serviceIndexModule;
    for (const key in serviceIndexModule) {
        const serviceConfig = serviceIndexModule[key];
        const serviceName = serviceConfig.name;
        const wrapper = wrapService(serviceConfig);
        if (_.isNil(wrapper)) {
            global.logger.error(`Service ${serviceName} is invalid, will ignore it!!!`);
            continue;
        }
        if (!_.isNil(global.services[serviceName])) {
            global.logger.error(`Service ${serviceName} has duplicated implementations!!!`);
            continue;
        }
        global.services[`${featureName}~${serviceName}`] = wrapper;
    }
};

const registerServices = (hostDir) => {
    const modules = getServiceModules(hostDir);
    modules.forEach(registerService);
};

module.exports = registerServices;
