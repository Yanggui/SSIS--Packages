"use strict";

const _ = require("lodash");
const contextManager = require("mdc-utils").contextManager;

exports.register = function (server, options, next) {
    server.ext("onPreAuth", (request, reply) => {
        if (_.isNil(request.contextId)) {
            request.contextId = contextManager.createContext({request, reply});
        }

        return reply.continue();
    });

    server.ext("onPreResponse", (request, reply) => {
        if (!_.isNil(request.contextId)) {
            contextManager.removeContext(request.contextId);
        }

        return reply.continue();
    });

    next();
};


exports.register.attributes = {
    name: "context-plugin",
    version: "1.0.0"
};