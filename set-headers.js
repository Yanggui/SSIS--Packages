"use strict";

const globalHeaders = [
    {key: "X-XSS-Protection", value: "1; mode=block"},
    {key: "X-Content-Type-Options", value: "nosniff"},
    {key: "X-UA-Compatible", value: "IE=Edge,chrome=1"},
    {key: "Vary", value: "X-PJAX, X-Requested-With, Accept-Encoding"}
];

exports.register = function (server, options, next) {
    server.ext("onPreResponse", (request, reply) => {
        const response = request.response;
        const canCache = request.path.match(/[-\.][\da-f]{8,}\.(css|js)$/g) !== null;
        if (request.response.isBoom) {
            globalHeaders.forEach((item) => {
                response.output.headers[item.key] = item.value;
            });
        } else {
            globalHeaders.forEach((item) => {
                response.header(item.key, item.value);
            });

            if (canCache) {
                response.header("cache-control", "max-age=31536000, must-revalidate, public");
            }
        }
        return reply.continue();
    });

    next();
};


exports.register.attributes = {
    name: "set-headers-plugin",
    version: "1.0.0"
};