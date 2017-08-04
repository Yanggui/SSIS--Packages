"use strict";

const Inert = require("inert");
const H2O2 = require("h2o2");
const Good = require("good");
const Disinfect = require("disinfect");
const Blipp = require("blipp");

const Context = require("../plugins/context");
const GlobalUserAuth = require("../plugins/global-user-auth");
const ErrorPages = require("../plugins/error-pages");
const SetHeaders = require("../plugins/set-headers");
const nodeEnv = require("./node-env");
const getGoodConfig = require("./good-modules/good-config");
const Profile = require("../plugins/profile");

const Config = require("../config");

const errorHandler = function (err) {
    if (err) {
        global.logger.error(`Failed to load a plugin: ${err}`);
        throw err;
    }
};

const disinfectOptions = {
    disinfectQuery: true,
    disinfectParams: true,
    disinfectPayload: false
};

const registerPlugins = function (server, dir, log) {

    // Register plugins from vendor
    server.register({ register: Good, options: getGoodConfig(log) }, errorHandler);

    server.register({ register: Disinfect, options: disinfectOptions }, errorHandler);

    server.register([Inert, H2O2], errorHandler);

    // Register custom plugins
    server.register([Context, GlobalUserAuth, ErrorPages, SetHeaders], errorHandler);

    if (Config.server.debug) {
        server.register([Profile], errorHandler);
    }

    // Register dev plugins
    if (nodeEnv.isDevelopment) {
        server.register([Blipp], errorHandler);
    }
};

module.exports = registerPlugins;