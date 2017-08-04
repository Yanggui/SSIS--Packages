"use strict";

const Path = require("path");

module.exports = function (server, dir) {
    server.route({
        method: "GET",
        path: "/{param*}",
        handler: {
            directory: {
                path: [Path.join(dir, "public"), Path.join(dir, "public", "assets")],
                listing: true,
                redirectToSlash: true,
                lookupCompressed: true
            }
        }
    });
};