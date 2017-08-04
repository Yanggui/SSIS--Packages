"use strict";
const ErrorPageHandler = require("../handlers/error-page-handlers");
const {showErrorPage} = require("../server/utils/error-utils");

const NOT_FOUND = 404;
const SERVER_INTERNAL_ERROR = 500;

exports.register = function (server, options, next) {
    server.ext("onPreResponse", (request, reply) => {
        if (request.response.isBoom) {
            const output = request.response.output;
            if (output.statusCode === NOT_FOUND) {
                return ErrorPageHandler.notFoundHandler(request, reply);
            }

            if (output.statusCode >= SERVER_INTERNAL_ERROR) {
                // An error {"bytesParsed":0,"code":"HPE_CB_headers_complete"} happend,
                // so the second request will hang when 500 error happens.
                // ErrorPageHandler.errorHandler(request, reply);
                // Temporary solution
                global.logger.error(request.response);
                return showErrorPage(request, reply);
            }
        }

        return reply.continue();
    });

    next();
};


exports.register.attributes = {
    name: "error-pages-plugin",
    version: "1.0.0"
};