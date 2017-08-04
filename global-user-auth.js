"use strict";
const JWT = require("jsonwebtoken");
const AuthorizationApi = require("mdc-apisdk/src/api/AuthorizationApi");
//const axios = require("axios");

const getChatPermission = (auth) => {
    const api = new AuthorizationApi();
    return api.authorizationGetTilePermissionForUser(auth.user.profile.UserId, "WEB CHAT", { alt: "json" }, null)
        .then(
        (response) => {
            if (response.data) {
                Object.assign(auth.user.profile, { webChatPermission: true });
            } else {
                Object.assign(auth.user.profile, { webChatPermission: false });
            }
        }
        );
};

const validCv2Cookie = (request, auth) => {
    const { state: { credentials } } = request;
    let credentialsValue = credentials;
    if (Array.isArray(credentials)) {
        credentialsValue = credentials[credentials.length - 1];
    }
    //const cert = "";
    //const userInfo = JWT.verify(credentialsValue, cert);

    if (!credentialsValue) {
        return;
    }
    const userInfo = JWT.decode(credentialsValue);
    if (userInfo) {
        auth.credentials = credentials;
        auth.isAuthenticated = !!userInfo.UserName;
        auth.strategy = "bypass";
        if (auth.isAuthenticated) {
            auth.user.userName = userInfo.UserName;
            Object.assign(auth.user, { profile: userInfo });
        }
    }
};

const getQueryalueFromUrl = (path, key) => {
    const match = path.match(new RegExp(`\\?.*?\\b${key}=(.+?)\\b`));
    return match && match[1];
};

exports.register = function (server, options, next) {
    server.ext("onPreAuth", (request, reply) => {//eslint-disable-line max-statements
        let userName = request.query.user_name || "";
        const auth = request.auth;
        let clientIp = "";
        if (request.headers["x-forwarded-for"] !== undefined) {
            clientIp = request.headers["x-forwarded-for"].split(",", 1).toString();
        }
        const referer = request.headers.referer;
        if (referer !== undefined) {
            userName = getQueryalueFromUrl(referer, "user_name");
        }
        auth.isAuthenticated = !!userName;
        auth.strategy = "bypass";
        auth.user = {
            userName,
            clientIp
        };
        if (!userName) {
            validCv2Cookie(request, auth);
        }

        if (auth.user.profile !== undefined && auth.isAuthenticated) {
            getChatPermission(auth).then(
                () => {
                    reply.continue();
                }
            );
            return null;
        }
        return reply.continue();
    });

    next();
};


exports.register.attributes = {
    name: "global-user-auth",
    version: "1.0.0"
};