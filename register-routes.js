"use strict";

const Config = require("../config");

const staticRoutes = require("../routes/static-files");
const debugRoutes = require("../routes/debug-routes");
const serviceRoutes = require("../routes/service-routes");

const registerRoutes = function (server, dir) {
    staticRoutes(server, dir);
    serviceRoutes(server, dir);
    if (Config.server.debug) {
        server.log(["info"], "Register debug routes");
        debugRoutes(server);
    }
};

module.exports = registerRoutes;
