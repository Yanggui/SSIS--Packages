"use strict";
const { ServiceManager } = require("mdc-utils");

module.exports = {
    service: (request, reply) => {
        const name = request.query.name;
        const payload = request.payload;
        const featureName = request.params.featureName;
        const data = ServiceManager.callService(name, payload.data, request.contextId, featureName);
        data.then((result) => {
            let jsonData = null;
            try {
                jsonData = JSON.stringify(result);
            } catch (error) {
                global.logger.error(error);
                const errorData = {success: false, error: "Failed to serialize the response to JSON"};
                jsonData = JSON.stringify(errorData);
            }
            return reply(jsonData).type("application/json");
        });
    }
};
