const React = require("react");
const ReactDOMServer = require("react-dom/server");
const crypto = require("crypto");
const Config = require("../config");

const ONE_HOUR = 3600000;
const ONE_SECOND = 1000;
let cache = null;

const initCache = (request) => {
    if (!cache) {
        cache = request.server.cache({ segment: "widgets", expiresIn: ONE_HOUR });
    }
};

const valiateWidget = (request, widget) => {
    if (!widget) {
        request.server.log("widget is invalid");
        return null;
    }

    if (widget.hasOwnProperty("default")) {
        widget = widget.default;
    }


    if (!widget.hasOwnProperty("id") || !widget.hasOwnProperty("create")) {
        request.server.log("widget is invalid: a widget should has id property and create()");
        return null;
    }

    return widget;
};

const createErrorWidget = (err) => {
    global.logger.error(err);
    const props = {
        className: "mdc-app",
        dangerouslySetInnerHTML: { __html: "Service Internal Error" }
    };

    return props;
};

const renderClientWidget = (widget, args) => {
    const props = {
        className: `mdc-app ${widget.id}--widget`,
        "data-params": JSON.stringify(args)
    };
    return Promise.resolve(props);
};

const createWidget = (widget, args, callback) => {
    let widgetPromise = null;
    try {
        widgetPromise = widget.create(args, {});
    } catch (err) {
        return Promise.resolve(createErrorWidget(err));
    }

    return widgetPromise.then(callback);
};

const renderServerWidget = (widget, args) => {
    const callback = (result) => {
        const component = result.component;
        const outputHtml = ReactDOMServer.renderToStaticMarkup(component);

        return {
            className: "mdc-app",
            dangerouslySetInnerHTML: { __html: outputHtml }
        };
    };

    return createWidget(widget, args, callback);
};

const renderIsomorphicWidget = (widget, args) => {
    const callback = (result) => {
        const component = result.component;
        const store = result.store;
        const outputHtml = ReactDOMServer.renderToString(component);

        delete store.contextId;

        return {
            className: `mdc-app ${widget.id}--widget`,
            dangerouslySetInnerHTML: { __html: outputHtml },
            "data-params": JSON.stringify(args),
            "data-state": JSON.stringify(store)
        };
    };

    return createWidget(widget, args, callback);
};

const lookupCachedWidget = (hashKey) => {
    return new Promise((resolve, reject) => {
        cache.get(hashKey, (err, value) => {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        });
    });
};

const startRender = (contextId, widget, args) => {
    args.contextId = contextId;
    const renderMode = widget.renderMode.toLowerCase();
    switch (renderMode) {
        case "client":
            return renderClientWidget(widget, args);
        case "server":
            return renderServerWidget(widget, args);
        default:
            return renderIsomorphicWidget(widget, args);
    }
};

const createWidgetHash = (widget, args) => {
    const argHash = crypto.createHash("md5").update(JSON.stringify(args)).digest("hex");
    return `${widget.id}${argHash}`;
};

const renderWidget = (contextId, widget, args, widgetKey, disableCacheForRequest) => {
    const renderMode = widget.renderMode.toLowerCase();

    let canCache = Config.enableWidgetCache && !disableCacheForRequest;
    let cacheTime = widget.cache;
    if (!cacheTime || isNaN(cacheTime) || renderMode === "client") {
        canCache = false;
    } else {
        cacheTime *= ONE_SECOND;
    }

    let result = null;
    if (canCache) {
        const hashKey = createWidgetHash(widget, args);
        result = lookupCachedWidget(hashKey).then((value) => {
            if (value) {
                return value;
            }
            return startRender(contextId, widget, args).then((newValue) => {
                cache.set(hashKey, newValue, cacheTime);
                return newValue;
            });
        });
    } else {
        result = startRender(contextId, widget, args);
    }

    return result.then((value) => {
        value.key = widgetKey;
        return React.createElement("div", value);
    }).catch((err) => {
        const value = createErrorWidget(err);
        value.key = widgetKey;
        return React.createElement("div", value);
    });
};

module.exports = { initCache, valiateWidget, renderWidget };