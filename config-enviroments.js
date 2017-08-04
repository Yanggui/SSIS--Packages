"use strict";

const Path = require("path");
const apiSdk = require("mdc-apisdk");
const Config = require("../config");

const NOT_FOUND_STATUS = 404;

const configApiSdk = function (dir, hostDir) {
    global.webRoot = Path.resolve(dir);
    global.webHostRoot = hostDir;
    global.webConfig = Config;
    apiSdk.ApiClient.settings.basePath = Config.api.serviceUrl.replace(/\/rest/g, "");
    apiSdk.ApiClient.settings.errorHandler = (error) => {
        if (error.status === NOT_FOUND_STATUS) {
            return;
        }
        global.logger.error(error);
    };
};

const configConnection = function (server) {
    const serverConfig = Config.server;
    server.connection({ host: serverConfig.host, port: serverConfig.port });
};

const configEnvironment = function (server, dir, hostDir) {
    configApiSdk(dir, hostDir);
    configConnection(server);
};

module.exports = configEnvironment;