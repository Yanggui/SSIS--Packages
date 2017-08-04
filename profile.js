
"use strict";
const axios = require("axios");
const _ = require("lodash");
const crypto = require("crypto");
const os = require("os");

const MAX_COUNT = 200000;
const ROUND_PRECISION = 2;

const requestMap = {};
const requests = [];
const hostname = os.hostname();
const instanceId = `${hostname}:${process.pid}:${_.random(999999)}`;

const wildApiCalls = [];

/* eslint max-len: 0 */
/* eslint max-statements: 0 */
/* eslint no-magic-numbers: 0 */

const buildPage = (data) => {
    const result = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>Requests Profile</title>
  </head>
  <body>
  <style>
        table {
            font-family: arial, sans-serif;
            border-collapse: collapse;
        }

        td, th {
            border: 1px solid #dddddd;
            padding: 8px;
            text-align: right;
            max-width: 700px;
            word-wrap: break-word;
        }

        .left {
            text-align: left;
        }

        .detail-item {
            border: 1px solid #ccc;
            margin-bottom: 20px;
            font-size: 13px;
        }

        .detail-item .header  {
            background-color: #efefef;
            padding: 10px;
        }

        .detail-item .header span {
                color: #888;
                font-size: 12px;
                display: inline-block;
                padding-left: 20px;
        }

        .detail-item .api-list {
            padding: 10px;
            overflow: auto;
        }

        .detail-item .bar {
            display: inline-block;
            margin-top: 4px;
            height: 10px;
            text-align: right;
        }
        .detail-item .api {
            display: inline-block;
            color: #aaa;
        }
        </style>
  <h3>${instanceId}</h3>
  ${data}
  </body> 
</html>`;
    return result;
};

const formatTime = (value) => {
    return _.round(value / 1000, 3);
};

const buildSummaryPage = (data) => {
    const result = [];
    result.push("<table>");
    result.push("<thead><tr><td class=\"left\">URL</td><td>Average (s)</td><td>MIN (s)</td><td>MAX (s)</td><td>Count</td></tr></thead><tbody>");

    let items = [];
    for (const url in data) {
        const value = data[url];
        const average = _.round(value.sum / value.count, ROUND_PRECISION);
        items.push({ url, min: value.min, max: value.max, avg: average, count: value.count, hash: value.hash });
    }
    items = _.sortBy(items, ["avg"]);
    items = _.reverse(items);
    items.forEach((value) => {
        result.push(`<tr><td class=\"left\"><a href="/request-profile?q=${value.hash}" target="_blank">${value.url}</a></td><td>${formatTime(value.avg)}</td><td>${formatTime(value.min)}</td><td>${formatTime(value.max)}</td><td>${value.count}</td></tr>`);
    });

    result.push("</tbody></table>");
    if (wildApiCalls.length > 0) {
        result.push("<h3>Not tracked API calls:</h3>");
        result.push("<ul>");
        wildApiCalls.forEach((url) => {
            result.push(`<li>${url}</li>`);
        });
        result.push("</url>");
    }
    return buildPage(result.join(""));
};

const formatDate = (d) => {
    if (!d) {
        return "";
    }

    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()} ${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()} UTC`;
};

const getChartUnit = (value) => {
    if (_.isNil(value)) {
        return 10;
    }
    const unit = _.round((value / 5000) * 10, 0);
    if (unit < 1) {
        return 1;
    }
    return unit;
};

const getChartColor = (value) => {
    if (value < 1000) {
        return "#83CE00";
    }
    if (value < 2000) {
        return "#FFCF00";
    }
    if (value < 5000) {
        return "#FF7D00";
    }
    return "#8B20BB";
};

const getChartBar = (offset, value, unit, overall) => {
    const offsetLength = offset / unit;
    let barLength;
    if (_.isNil(value)) {
        barLength = 0;
    } else {
        barLength = value / unit;
        if (barLength < 1) {
            barLength = 1;
        }
    }
    let timeLabel = _.isNil(value) ? "Incompleted " : `${formatTime(value)}s `;
    if (overall) {
        timeLabel = `(Overall) ${timeLabel}`;
    }
    const color = getChartColor(value);
    return `<div class="bar" style="width:${barLength}px;margin-left:${offsetLength}px;background-color: ${color}"></div> ${timeLabel}`;
};

const buildDetailpage = (items) => {
    if (items.length < 1) {
        return buildPage("Not Found");
    }

    const result = [];
    items.forEach((item) => {
        result.push(`<div class="detail-item">`);
        const unit = getChartUnit(item.total);
        result.push(`<div class="header"><div>${item.method}: ${item.url}   <span class="">${formatDate(item.startTime)}</span></div>`);
        if (!_.isNil(item.payload)) {
            result.push(`<div>Payload: ${JSON.stringify(item.payload)}</div>`);
        }
        result.push(`</div>`);

        result.push(`<div class="api-list">${getChartBar(0, item.total, unit, true)}`);
        item.apis.forEach((api) => {
            result.push(`<div>${getChartBar(api.offset, api.total, unit)}<div class="api"> (${api.method}: ${api.status} ${api.url})</div></div>`);
        });
        result.push(`</div>`);
        result.push("</div>");
    });
    return buildPage(result.join(""));
};

const handleDetail = (q) => {
    let resultList = [];
    for (const id in requestMap) {
        const info = requestMap[id];
        if (q !== info.hash) {
            continue;
        }
        resultList.push(info);
    }
    resultList = _.reverse(_.sortBy(resultList, ["total"]));
    return resultList;
};

const handleSummary = () => {
    const resultMap = {};
    for (const id in requestMap) {
        const info = requestMap[id];
        const total = info.total;
        if (isNaN(total)) {
            continue;
        }
        let resultItem = resultMap[info.url];
        if (!resultItem) {
            resultItem = { hash: info.hash, min: total, max: total, sum: total, count: 1 };
            resultMap[info.url] = resultItem;
        } else {
            if (total < resultItem.min) {
                resultItem.min = total;
            } else if (total > resultItem.max) {
                resultItem.max = total;
            }

            resultItem.sum += total;
            resultItem.count++;
        }
    }

    return resultMap;
};

const handleRequest = (request, reply) => {
    const q = request.query.q;
    if (q) {
        const details = handleDetail(q);
        reply(buildDetailpage(details));
    } else {
        const summary = handleSummary();
        reply(buildSummaryPage(summary));
    }
};

const createResult = (url, mainStartTime, startTime, method, status) => {
    const endTime = new Date();
    const offset = startTime - mainStartTime;
    return { url, offset, total: endTime - startTime, method, status };
};

exports.register = function (server, options, next) {
    server.ext("onPostAuth", (request, reply) => {
        if (request.path === "/request-profile" || request.route.path === "/{param*}") {
            return reply.continue();
        }

        const contextId = request.contextId;
        const host = request.headers.host;
        const url = `//${host}${request.url.path}`;
        const hash = crypto.createHash("md5").update(url).digest("hex");
        const method = request.method.toUpperCase();
        const payload = (method === "POST" && !_.isNil(request.payload)) ? request.payload : null;
        requestMap[request.contextId] = { url, hash, method, startTime: new Date(), apis: [], payload };
        requests.push(contextId);
        if (requests.length > MAX_COUNT) {
            delete requestMap[requests.shift()];
        }
        return reply.continue();
    });

    server.ext("onPreResponse", (request, reply) => {
        const value = requestMap[request.contextId];
        if (value) {
            value.endTime = new Date();
            value.total = value.endTime - value.startTime;
        }
        return reply.continue();
    });

    axios.interceptors.request.use((config) => {
        if (!config.contextId) {
            if (wildApiCalls.length < 200 && wildApiCalls.indexOf(config.url) < 0) {
                wildApiCalls.push(config.url);
            }
        }
        config.startTime = new Date();
        return config;
    }, (error) => {
        return Promise.reject(error);
    });

    const recordResponse = (response) => {
        const config = response.config;
        if (!config) {
            return;
        }

        const contextId = config.contextId;
        if (!contextId) {
            return;
        }

        const value = requestMap[contextId];
        const headers = response.request._headers;
        if (value && headers) {
            const mainStartTime = value.startTime;
            const startTime = config.startTime;
            const host = headers.host;
            const status = response.status;
            const result = createResult(`//${host}${response.request.path}`, mainStartTime, startTime, config.method, status);
            value.apis.push(result);
        }
    };

    axios.interceptors.response.use((response) => {
        recordResponse(response);
        return response;
    }, (error) => {
        recordResponse(error);
        return Promise.reject(error);
    });

    server.route(
        {
            method: "GET",
            path: "/request-profile",
            handler: handleRequest
        });

    next();
};

exports.register.attributes = {
    name: "profile-plugin",
    version: "1.0.0"
};