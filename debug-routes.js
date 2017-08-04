"use strict";

const handlers = require("../handlers/debug-handlers");

module.exports = function (server) {
    server.route(
        {
            method: "GET",
            path: "/debug-widget/{feature}/{widget}",
            handler: (request, reply) => {
                reply.redirect(request.path.replace("/debug-widget/", "/test-widget/"));
            }
        });

    server.route(
        {
            method: "GET",
            path: "/test-widget/{feature}/{widget}",
            handler: handlers.showSingleWidget
        });

    server.route(
        {
            method: "GET",
            path: "/widget-list",
            handler: handlers.showAvailableWidgets
        });

    server.route(
        {
            method: "GET",
            path: "/route-list",
            handler: handlers.showAllRoutes
        });
};