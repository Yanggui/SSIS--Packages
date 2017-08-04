"use strict";

const url = require("url");

const getPreviousPageUrl = function (theUrlReferrer) {  //eslint-disable-line max-statements
    const urlReferrer = url.parse(theUrlReferrer, true);
    if (theUrlReferrer === null) {
        return "";
    }

    const aPreUrl = urlReferrer.pathname.toLowerCase();
    let aUrlContent = "";

    let aDict;

    if (aPreUrl.toLowerCase().indexOf("/page/search.aspx") >= 0) {
        aDict = urlReferrer.query;
        aUrlContent = "kw=".concat(aDict.kw) + "rd=".concat(aDict.rd) + "ed=".concat("ed");
    } else if (aPreUrl.indexOf("/credit-ratings/") >= 0) {
        aUrlContent = aPreUrl.toLowerCase().substring(aPreUrl.lastIndexOf("-") + 1);
    } else if (aPreUrl.indexOf("/research/") >= 0) {
        aDict = urlReferrer.query;
        let aDocIdBegin = aPreUrl.lastIndexOf("--");
        if (aDocIdBegin < 0) {
            aDocIdBegin = aPreUrl.lastIndexOf("-") - 1;
        }

        if (aDict.docid !== undefined) {
            aUrlContent = aDict.docid;
        } else {
            aUrlContent = aDocIdBegin > 0 && theUrlReferrer.AbsolutePath
            ? theUrlReferrer.AbsolutePath.substring(aDocIdBegin + 2)  //eslint-disable-line no-magic-numbers
            : "";
        }
    } else if (aPreUrl.indexOf("viewresearchdoc.aspx") >= 0) {
        aDict = urlReferrer.query;
        aUrlContent = aDict.docid !== undefined ? aDict.docid : "";
    } else {
        aUrlContent = urlReferrer.path;
    }

    return aUrlContent;
};

module.exports = {
    getPreviousPageUrl
};