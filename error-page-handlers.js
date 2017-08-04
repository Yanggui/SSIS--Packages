"use strict";

const PageRenderer = require("../renderer/page-renderer");
const GlobalWidget = require("mdc-global").default;

const NOT_FOUND = 404;
const SERVER_INTERNAL_ERROR = 500;

const createPageRenderer = function (request, reply) {
    const renderer = new PageRenderer(request, reply);
    renderer.init();
    return renderer;
};

module.exports = {
    errorHandler: (request, reply) => {
        const renderer = createPageRenderer(request, reply);
        renderer.setTitle(`Server Internal Error - Moody's`);
        renderer.addTop(GlobalWidget.ErrorPageContent);
        renderer.render().then((result) => {
            return result.code(SERVER_INTERNAL_ERROR);
        });
    },
    notFoundHandler: (request, reply) => {
        const renderer = createPageRenderer(request, reply);
        renderer.setTitle(`Not Found - Moody's`);
        renderer.addTop(GlobalWidget.NotFoundContent);
        renderer.render().then((result) => {
            return result.code(NOT_FOUND);
        });
    }
};
