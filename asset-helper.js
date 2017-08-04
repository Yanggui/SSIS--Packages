"use strict";

const fs = require("fs");
const util = require("util");
const Path = require("path");
const _ = require("lodash");

const Config = require("../config");
const nodeEnv = require("../server/node-env");
const ManifestFile = "rev-manifest.json";

const getJsonFile = function (path) {
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, "utf8");
        return JSON.parse(data);
    }

    return null;
};

const fileMap = {};

const assetFor = function (fileName, path) {
    const result = fileMap[fileName];
    if (!_.isNil(result)) {
        return result;
    }

    const json = getJsonFile(Path.join(path, ManifestFile));
    const hashFileName = _.isNil(json) ? fileName : json[fileName];
    if (_.isNil(hashFileName) || !fs.existsSync(Path.join(path, hashFileName))) {
        return null;
    }

    const assetUrl = util.format("/assets/%s", hashFileName);
    fileMap[fileName] = assetUrl;
    return assetUrl;
};

const assetForJs = function (moduleName) {
    const path = Path.join(global.webHostRoot, "public", "assets");
    return assetFor(`${moduleName}.js`, path);
};

const assetForCss = function (moduleName) {
    const path = Path.join(global.webHostRoot, "public", "assets");
    return assetFor(`${moduleName}.css`, path);
};

const assetForPublicAssets = function (bundleName) {
    const path = Path.join(global.webHostRoot, "public", "assets");
    return assetFor(bundleName, path);
};

const getPolyfillJs = () => {
    return assetForPublicAssets("cv2-polyfill.js");
};

const getCoreVendorJs = () => {
    if (nodeEnv.isDevelopment) {
        return assetForPublicAssets("cv2-core-vendors-dev.js");
    }
    return assetForPublicAssets("cv2-core-vendors.js");
};

const getChartJs = () => {
    return assetForPublicAssets("cv2-chart.js");
};

const getJQueryJs = () => {
    return assetForPublicAssets("cv2-jquery.js");
};

const getDatatableJs = () => {
    return assetForPublicAssets("cv2-datatables.js");
};

const getExcelBuilderJs = () => {
    return assetForPublicAssets("cv2-excel-builder.js");
};
const getPdfBuilderJs = () => {
    return assetForPublicAssets("cv2-pdf-builder.js");
};
const getLayoutCss = () => {
    return assetForPublicAssets("layout.css");
};

const getNeptuneCss = () => {
    return `/assets/mdc-neptune${nodeEnv.isDevelopment ? "" : ".min"}.css`;
};

const getNeptuneJs = () => {
    return `/assets/mdc-neptune-client${nodeEnv.isDevelopment ? "" : ".min"}.js`;
};

const getGoogleAnalyticsJs = () => {
    return `https://www.google-analytics.com/analytics.js`;
};

const getWebChatJs = () => {
    return "https://c.la3-c2cs-chi.salesforceliveagent.com/content/g/js/38.0/deployment.js";
};

const getGigyaJs = (request) => {
    return (request.connection.info.protocol === "https:" ? "//cdns" : "//cdn").concat(Config.gigyaURL);
};

module.exports = {
    assetForJs,
    assetForCss,
    getPolyfillJs,
    getCoreVendorJs,
    getChartJs,
    getJQueryJs,
    getDatatableJs,
    getExcelBuilderJs,
    getPdfBuilderJs,
    getLayoutCss,
    getNeptuneCss,
    getNeptuneJs,
    getGoogleAnalyticsJs,
    getWebChatJs,
    getGigyaJs
};