const { AuthorizationApi } = require("mdc-apisdk");
const _ = require("lodash");

const hasTilePermission = (userId, tile) => {
    if (_.isNil(tile)) {
        return true;
    }

    const api = new AuthorizationApi();
    return api.permissionGetTilePermissionForUser(userId, tile, {alt: "json"}, null).then((response) => {
        return response.success && response.data === true;
    });
};

const hasPagePermission = (userId, pageUrl) => {
    if (_.isNil(pageUrl)) {
        return true;
    }

    const api = new AuthorizationApi();
    return api.getPagePermission(userId, pageUrl, {alt: "json"}, null).then((response) => {
        return response.success;
    });
};

const hasResearchPermission = (userId, docs) => {
    if (_.isNil(docs) || _.isEmpty(docs)) {
        return true;
    }

    const api = new AuthorizationApi();
    return api.getResearchDocumentPermission(userId, docs, {alt: "json"}, null).then((response) => {
        return response.success;
    });
};

const hasIssuerPermission = (userId, orgId) => {
    if (_.isNil(orgId)) {
        return true;
    }

    const api = new AuthorizationApi();
    return api.getDataSetPermissionForUser(userId, orgId, {alt: "json"}, null).then((response) => {
        return response.success;
    });
};

const hasSpecialPermission = (userId, type, orgId) => {
    if (_.isNil(type) && _.isNil(orgId)) {
        return true;
    }

    if (_.isNil(type) || _.isNil(orgId)) {
        return false;
    }

    const api = new AuthorizationApi();
    return api.getSpecialTypeDataSetPermissionForUser(userId, type, orgId, {alt: "json"}, null).then((response) => {
        return response.success;
    });
};

const hasPermissions = (permissions, request) => {
    const userId = request.auth.user.profile.UserId;
    const requests = [
        hasTilePermission(userId, permissions.tile),
        hasPagePermission(userId, permissions.page),
        hasResearchPermission(userId, permissions.docs(request)),
        hasIssuerPermission(userId, permissions.issuer(request)),
        hasSpecialPermission(userId, permissions.special(request))
    ];
    return Promise.all(requests).then((responses) => {
        if (_.some(responses, false)) {
            return false;
        }

        return true;
    });
};

module.exports = hasPermissions;