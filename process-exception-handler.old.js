// no longer used - process events are handled provided externally

"use strict";

const timeToWaitForConnectionsToComplete = 10000;
const milliseconds = 1000;

/* eslint "no-process-exit": 0 */
exports.register = function (server, options, next) {
    process.on("uncaughtException", (err) => {
        server.log(["error"], `uncaughtException: ${err.message}`);
        server.log(["error"], err.stack);
        server.log(["error"], "Stopping server...");

        try {
            server.stop({ timeout: timeToWaitForConnectionsToComplete }, () => {
                server.log(["error"], "Server stopped. Terminating node process");
                process.exit(1);
            });
        } catch (e) {
            const msg = `Could not gracefully stop server. `
                + `Terminating node process when idle or forcefully `
                + `in ${timeToWaitForConnectionsToComplete / milliseconds}s`;
            server.log(["error"], msg);
            setTimeout(() => {
                server.log(["error"], "Terminating node process");
                process.exit(1);
            }, timeToWaitForConnectionsToComplete).unref();
        }
    });

    process.on("unhandledRejection", (reason, promise) => {
        let data = null;
        if (reason.hasOwnProperty("message")) {
            data = {message: reason.message, stack: reason.stack};
        } else if (reason.hasOwnProperty("statusText")) {
            data = {message: reason.statusText, config: reason.config};
        } else {
            data = {reason, promise};
        }

        server.log(["error", "unhandledRejection"], data);
    });

    next();
};


exports.register.attributes = {
    name: "global-exception-handler-plugin",
    version: "1.0.0"
};