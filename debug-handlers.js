"use strict";

const fs = require("fs");
const Path = require("path");
const PageRenderer = require("../renderer/page-renderer");

const noneWidgetPackage = ["mdc-apisdk", "mdc-common-view", "mdc-neptune", "mdc-utils"];

const loadFeature = (featureName) => {
    let feature = null;
    try {
        feature = require(featureName);
    } catch (err) {
        return null;
    }

    if (feature.hasOwnProperty("default")) {
        feature = feature.default;
    }

    return feature;
};

const getWidget = (feature, featureName, widgetName) => {
    const result = {widget: null, success: false, message: null};
    let widget = feature[widgetName];
    if (!widget) {
        result.message = `Cannot find widget ${widgetName} in feature ${featureName}`;
        return result;
    }

    if (widget.hasOwnProperty("default")) {
        widget = widget.default;
    }

    if (!widget.hasOwnProperty("id")) {
        result.message = `Widget ${widgetName} doesn't has 'id' property.`;
        return result;
    }

    if (!widget.hasOwnProperty("create")) {
        result.message = `Widget ${widgetName} doesn't has 'create' property.`;
        return result;
    }

    if (!widget.hasOwnProperty("renderMode")) {
        result.message = `Widget ${widgetName} doesn't has 'renderMode' property.`;
        return result;
    }

    result.widget = widget;
    result.success = true;
    return result;
};

const getParameters = (widget, query) => {
    const paramTypes = widget.paramTypes;
    const errors = [];
    const result = {};
    for (const param in paramTypes) {
        const typeMeta = paramTypes[param];
        switch (typeMeta.type) {
            case "bool":
                typeMeta.oneOf = [true, false];
                typeMeta.example = "true";
                break;
            case "object":
                typeMeta.oneOf = null;
        }

        if (!typeMeta) {
            errors.push(`Parameter ${param} is required.`);
            continue;
        }

        let value = query[param];
        if (!value) {
            if (typeMeta.required === true) {
                errors.push(`Parameter ${param} is required.`);
            }
            continue;
        }

        switch (typeMeta.type) {
            case "bool":
                value = value.toLowerCase() === "true";
                break;
            case "number":
                value = parseFloat(value);
                if (isNaN(value)) {
                    errors.push(`Parameter ${param} is not a number.`);
                }
                break;
            case "object":
                try {
                    value = JSON.parse(value);
                } catch (error) {
                    errors.push(`${param} is not a valid JSON string`);
                    continue;
                }
                break;
        }

        if (typeMeta.oneOf) {
            if (typeMeta.oneOf.indexOf(value) < 0) {
                errors.push(`${param} is invalid`);
                continue;
            }
        }

        result[param] = value;
    }

    return (errors.length > 0) ? {success: false, errors} : {success: true, result};
};

const renderPossibleValues = (values) => {
    if (!values) {
        return "";
    }

    const result = values.map((value) => {
        return JSON.stringify(value);
    });

    return result.join(", ");
};

const additionalParameters = {
    mode: {type: "string", required: false, oneOf: ["client", "server", "both"], example: "client"},
    "api_url": {type: "string", required: false, example: "http://apc-wbmdcwss201:2424/rest"},
    "tc_id": {type: "string", required: false, example: ""}
};

const fillParameterTable = (result, paramTypes) => {
    result.push("<table>");
    result.push("<thead>");
    result.push("<tr><th>Name</th><th>Type</th><th>Required</th><th>Possible Values</th><th>Example</th></tr>");
    result.push("</thead>");
    result.push("<tbody>");
    for (const paramName in paramTypes) {
        const value = paramTypes[paramName];
        const cells = ["<tr>"];
        cells.push(`<td>${paramName}</td>`);
        cells.push(`<td>${value.type}</td>`);
        cells.push(`<td>${value.required}</td>`);
        cells.push(`<td>${renderPossibleValues(value.oneOf)}</td>`);
        cells.push(`<td>${value.example}</td>`);
        cells.push("</tr>");
        result.push(cells.join(""));
    }
    result.push("</tbody>");
    result.push("</table>");
};

const renderParamInvalidPage = (widget, reply, errors) => {
    const paramTypes = widget.paramTypes;
    const result = ["<h2>Widget Parameter</h2>"];
    const tableStyle = `<style>
                        table {
                            font-family: arial, sans-serif;
                            border-collapse: collapse;
                        }

                        td, th {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        </style>`;
    result.push(tableStyle);

    fillParameterTable(result, paramTypes);
    if (errors) {
        result.push(`<div style="color: red; margin-top:20px">`);
        result.push(`<strong>Please check your URL parameter and try again</strong>`);
        result.push(`<ul><li>${errors.join("</li><li>")}</li></ul>`);
        result.push("</div>");
    }

    result.push("<h2>Additional Parameters");
    fillParameterTable(result, additionalParameters);
    reply(result.join(""));
};

const getWidgetDefaultQuery = (widget) => {
    const paramTypes = widget.paramTypes;
    const result = [];
    for (const param in paramTypes) {
        const typeMeta = paramTypes[param];
        let example = typeMeta.example;
        if (!example) {
            switch (typeMeta.type) {
                case "bool":
                    example = "true";
                    break;
                case "object":
                    example = "{}";
                    break;
                default:
                    example = "";
            }
        }
        global.logger.log(example);
        example = encodeURIComponent(example);
        global.logger.log(example);
        result.push(`${param}=${example}`);
    }

    result.push("mode=client");
    return result.join("&");
};

/* eslint "global-require": 0 */
/* eslint "max-statements": 0 */
/* eslint "complexity": 0 */
module.exports = {
    showAllRoutes: (request, reply) => {
        const tables = request.server.table()[0].table;
        request.server.log(tables);
        const routes = tables.map((table) => {
            return {path: table.path, method: table.method};
        });
        request.server.log(routes);
        reply(JSON.stringify(routes)).type("text/javascript");
    },
    showSingleWidget: (request, reply) => {
        const renderer = new PageRenderer(request, reply);
        renderer.initForSingleWidget();

        const featureName = request.params.feature;
        const widgetName = request.params.widget;


        if (!featureName || !widgetName) {
            reply("Query parameters 'feature' and 'widget' are required");
            return;
        }

        const feature = loadFeature(featureName);
        if (!feature) {
            reply(`Cannot load feature: ${featureName}`);
            return;
        }

        const widgetResult = getWidget(feature, featureName, widgetName);
        if (!widgetResult.success) {
            reply(widgetResult.message);
            return;
        }

        let renderMode = request.query.mode;
        if (renderMode) {
            renderMode = renderMode.toLowerCase();
        }

        const widget = widgetResult.widget;
        if (renderMode === "client" || renderMode === "server" || renderMode === "both") {
            widget.renderMode = renderMode;
        }

        const parameterResult = getParameters(widget, request.query);
        if (!parameterResult.success) {
            renderParamInvalidPage(widget, reply, parameterResult.errors);
            return;
        }

        renderer.setTitle(widgetName);
        renderer.addAssets(featureName);
        renderer.addTop(widget, parameterResult.result);
        renderer.render();
    },

    showAvailableWidgets: (request, reply) => {
        const modules = fs.readdirSync(Path.join(global.webHostRoot, "node_modules"));
        const result = ["<div class='widget-list-page-content'><h2>Available Widgets</h2>"];

        const style = `<style>
                        .widget-list-page-content {
                            width: 80%;
                            margin-left: auto;
                            margin-right: auto;
                        }
                        section {
                            font-family: arial, sans-serif;
                            float: left;
                            padding: 0 10px;
                            height: 300px;
                            border: 1px solid #DEDEDE;
                            width: 200px;
                        }
                        ul {
                            padding-left: 10px; 
                        }
                        h4 {
                            margin-bottom: 0;
                        }
                        </style>`;
        result.push(style);

        modules.forEach((m) => {
            if (m.toLowerCase().indexOf("mdc-") === 0 && noneWidgetPackage.indexOf(m) < 0) {
                const featureName = m;
                const feature = loadFeature(featureName);
                if (!feature) {
                    return;
                }

                const widgets = [];
                for (const widgetName in feature) {
                    const widgetResult = getWidget(feature, featureName, widgetName);
                    if (widgetResult.success) {
                        const query = getWidgetDefaultQuery(widgetResult.widget);
                        const url = `/test-widget/${featureName}/${widgetName}?${query}`;
                        widgets.push({name: widgetName, url});
                    }
                }

                if (widgets.length > 0) {
                    result.push(`<section><h4>${featureName}</h4>`);
                    result.push("<ul>");
                    widgets.forEach((info) => {
                        result.push(`<li><a href="${info.url}" target="_blank">${info.name}</a></li>`);
                    });
                    result.push("</ul></section>");
                }
            }
        });

        result.push("</div>");
        reply(result.join(""));
    }
};
