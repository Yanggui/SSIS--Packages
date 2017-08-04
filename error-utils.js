"use strict";
const crypto = require("crypto");

const SERVER_INTERNAL_ERROR = 500;

const createErrorId = (data) => {
    const generator = crypto.createHash("md5");
    generator.update(data);
    return generator.digest("hex");
};

const showErrorPage = (request, reply) => {
    const errorId = createErrorId(request.id);
    return reply(`<h3>Server Internal Error.</h3><br/>Error Id: ${errorId}`).code(SERVER_INTERNAL_ERROR);
};

module.exports = {createErrorId, showErrorPage};