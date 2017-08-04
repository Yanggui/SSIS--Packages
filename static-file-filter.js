"use strict";

const Stream = require("stream");

const CLIENT_ERROR = 400;

class StaticFileFilter extends Stream.Transform {
    constructor() {
        super({ objectMode: true });
    }

    _transform(data, enc, next) {
        if (data && data.route === "/{param*}" && data.statusCode < CLIENT_ERROR) {
            return next(null, null);
        }

        return next(null, data);
    }
}

module.exports = StaticFileFilter;