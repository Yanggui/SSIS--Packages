"use strict";
const SharedApps = require("mdc-global").default;
const Config = require("../config");
const validateArgs = require("./args-validator");
const MetaHelper = require("./meta-helper");
const AssetManager = require("./asset-manager");
const widgetRenderer = require("./widget-renderer");
const renderPage = require("../templates");

class PageRenderer {
    constructor(request, reply) {
        this._title = "Moodys.com";
        this._assetManager = new AssetManager();
        this._metas = [];
        this._view = "page";
        this._middleView = null;
        this._promises = [];
        this._pjax = false;
        this._appMap = {};
        this._appCount = 0;
        this._request = request;
        this._reply = reply;
        widgetRenderer.initCache(request);
    }

    init() {
        this._assetManager.init(this._request);
        this._metas = MetaHelper.getWebTrendsMetas(this._request);
        this._initWidget(SharedApps.PageHeader,
            {
                gtmCode: Config.gtmCode, authInfo: this.getAuthInfo(),
                orgId: this._request.params.orgId
            }, "header");
        this._initWidget(SharedApps.TopMessageBar, { msgDelayTime: Config.message.msgDelayTime }, "header");
        const footer = SharedApps.PageFooter;
        footer.renderMode = "client";
        this._initWidget(footer, { orgId: this._request.params.orgId }, "footer");
    }

    initForGlobalHeaderWidget() {
        this._assetManager.init(this._request);
        this._metas = MetaHelper.getWebTrendsMetas(this._request);
        this._initWidget(SharedApps.PageHeader,
            {
                gtmCode: Config.gtmCode, authInfo: this.getAuthInfo(),
                orgId: this._request.params.orgId
            }, "header");
    }

    initForGlobalFooterWidget() {
        this._assetManager.init(this._request);
        this._metas = MetaHelper.getWebTrendsMetas(this._request);
        this._initWidget(SharedApps.PageFooter, {}, "header");
    }

    initForSingleWidget() {
        this._assetManager.initWithDebug(this._request);
        this._metas = MetaHelper.getWebTrendsMetas(this._request);
        this._initWidget(SharedApps.TopMessageBar, { msgDelayTime: Config.message.msgDelayTime }, "header");
    }

    addAllVendorAssets() {
        this._assetManager.addAllVendorAssets();
    }

    addChartJs() {
        this._assetManager.addChartJs();
    }

    addJQueryJs() {
        this._assetManager.addJQueryJs();
    }

    addDatatablesJs() {
        this._assetManager.addDatatablesJs();
    }

    addExcelBuilderJs() {
        this._assetManager.addExcelBuilderJs();
    }
    addPdfBuilderJs() {
        this._assetManager.addPdfBuilderJs();
    }
    getAuthInfo() {
        const authInfo = this._request.auth;
        if (!!authInfo && !!authInfo.user && !!authInfo.user.profile) {
            delete authInfo.user.profile.UserId;
        }
        return {
            isAuthenticated: authInfo.isAuthenticated,
            user: authInfo.user
        };
    }

    setPjax(value) {
        this._pjax = value;
    }

    setMiddleView(value) {
        this._middleView = value;
    }

    addBanner(widget, args) {
        this._initWidget(widget, args, "banner");
    }

    addTop(widget, args) {
        this._initWidget(widget, args, "top");
    }

    addLeft(widget, args) {
        this._initWidget(widget, args, "left");
    }

    addRight(widget, args) {
        this._initWidget(widget, args, "right");
    }

    addMiddle(widget, args, positionTag, order) {
        this._initWidget(widget, args, "middle", positionTag, order);
    }

    addAssets(moduleName) {
        this._assetManager.addFeatureAssets(moduleName);
    }

    addScript(url) {
        if (url && this._scripts.indexOf(url) < 0) {
            this._scripts.push(url);
        }
    }

    addMeta(name, content) {
        this._metas.push({ name, content });
    }

    addStyle(url) {
        if (url && this._styles.indexOf(url) < 0) {
            this._styles.push(url);
        }
    }

    setTitle(title) {
        this._title = title;
    }

    _initWidget(widget, args, area, positionTag, order) {
        widget = widgetRenderer.valiateWidget(this._request, widget);
        if (!widget) {
            return null;
        }

        args = !args ? {} : args;
        if (Config.server.debug) {
            validateArgs(widget, args);
        }

        const widgetKey = `${widget.id}${this._appCount}`;
        this._appCount++;
        const disableCache = this._request.query.cache === "false";
        const p = widgetRenderer.renderWidget(this._request.contextId, widget, args, widgetKey, disableCache);
        this._promises.push(p);
        this._appMap[widgetKey] = { area, tag: positionTag, order };
        return p;
    }

    render() {
        const self = this;
        return Promise.all(this._promises).then((data) => {
            const result = {
                title: self._title,
                scripts: self._assetManager.getAllScripts(),
                styles: self._assetManager.getAllStyles(),
                metas: self._metas,
                pjax: self._pjax,
                middleView: self._middleView,
                banner: [],
                header: [],
                footer: [],
                top: [],
                left: [],
                right: [],
                middle: []
            };

            const appAreas = ["banner", "header", "footer", "top", "left", "right"];
            data.forEach((app) => {
                const appLayout = self._appMap[app.key];

                if (appAreas.indexOf(appLayout.area) >= 0) {
                    result[appLayout.area].push(app);
                } else {
                    appLayout.app = app;
                    result.middle.push(appLayout);
                }
            });

            const html = self._pjax ? renderPage("pjax", result) : renderPage("page", result);
            return self._reply(html);
        }).catch((err) => {
            global.logger.error(err);
        });
    }
}

module.exports = PageRenderer;