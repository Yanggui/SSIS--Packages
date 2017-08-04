"use strict";

const handlers = require("../handlers/service-handlers");

module.exports = function (server) {
    server.route(
        {
            method: "POST",
            path: "/services/{featureName}",
            config: {
                auth: false,
                handler: handlers.service,
                timeout: {
                    server: false,
                    socket: 600000
                }
            }
        });
};