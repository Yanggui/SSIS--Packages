const webtrendsHelper = require("./webtrends-helper");
const Config = require("../config");

const getMeta = (name, content) => {
    return {name, content};
};

const getWebTrendsMetas = (request) => {
    const metas = [];
    let userId;
    let loginUserType;
    if (request.auth.user.profile !== undefined) {
        userId = request.auth.user.profile.UserId;
        loginUserType = request.auth.user.profile.LoginUserType;
    } else {
        userId = "000000000000000000000000000000000000";
        loginUserType = 0;
    }
    const metasDic = [{ key: "WT.z_dcsid", value: Config.WebTrendsDcsId },
    { key: "WT.dcsvid", value: userId },
    { key: "WT.z_usersource", value: loginUserType },
    { key: "WT.cg_sec5", value: "en" },
    { key: "WT.cg_sec6", value: "global~global" }];
    metasDic.map((item) => {
        metas.push(getMeta(item.key, item.value));
    });

    if (request.headers.referer !== undefined) {
        metas.push(getMeta("WT.z_previouspage", webtrendsHelper.getPreviousPageUrl(request.headers.referer)));
    }
    return metas;
};

module.exports = { getWebTrendsMetas };