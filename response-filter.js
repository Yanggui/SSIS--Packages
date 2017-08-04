"use strict";

const Stream = require("stream");
const {createErrorId} = require("../utils/error-utils");

const INTERNAL_ERROR = 500;

class ErrorFilter extends Stream.Transform {
    constructor(config) {
        super({ objectMode: true });
        this._settings = config;
    }

    _transform(data, enc, next) {
        if (!data) {
            return next(null, data);
        }

        const isError = data.statusCode >= INTERNAL_ERROR || (data.tags && data.tags.indexOf("error") >= 0);
        if ((isError && this._settings.showError) || (!isError && !this._settings.showError)) {
            if (isError && data.id) {
                data.id = createErrorId(data.id);
            }
            return next(null, data);
        }

        return next(null, null);
    }
}


module.exports = ErrorFilter;