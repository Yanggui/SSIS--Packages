const AssetHelper = require("./asset-helper");
const UserAgentUtil = require("../server/utils/user-agent-util");

class AssetManager {
    constructor() {
        this._basicScripts = [];
        this._customBasicScripts = [];
        this._commonFeatureScripts = [];
        this._featureScripts = [];

        this._basicStyles = [AssetHelper.getLayoutCss(), AssetHelper.getNeptuneCss()];
        this._featureStyles = [];
    }

    init(request) {
        if (!UserAgentUtil.isEs6Browser(request)) {
            this._addScript(this._basicScripts, AssetHelper.getPolyfillJs());
        }

        this._addScript(this._basicScripts, AssetHelper.getCoreVendorJs());

        this._addScript(this._commonFeatureScripts, AssetHelper.getNeptuneJs());
        this._addScript(this._commonFeatureScripts, AssetHelper.getGigyaJs(request));
        this._addScript(this._commonFeatureScripts, AssetHelper.getWebChatJs());
        this._addScript(this._commonFeatureScripts, AssetHelper.getGoogleAnalyticsJs());

        this.addFeatureAssets("mdc-apisdk");
        this.addFeatureAssets("mdc-utils");
        this.addFeatureAssets("mdc-global");
    }

    initWithDebug(request) {
        this._addScript(this._basicScripts, "/debug/debug.js");
        this.init(request);
        this._addStyle(this._basicStyles, `/debug/debug.css`);
        this.addAllVendorAssets();
    }

    _addScript(scripts, url) {
        if (url && scripts.indexOf(url) < 0) {
            scripts.push(url);
        }
    }

    _addStyle(styles, url) {
        if (url && styles.indexOf(url) < 0) {
            styles.push(url);
        }
    }

    addAllVendorAssets() {
        this.addChartJs();
        this.addJQueryJs();
        this.addDatatablesJs();
        this.addExcelBuilderJs();
    }

    addChartJs() {
        this._addScript(this._customBasicScripts, AssetHelper.getChartJs());
    }

    addJQueryJs() {
        this._addScript(this._customBasicScripts, AssetHelper.getJQueryJs());
    }

    addDatatablesJs() {
        this._addScript(this._customBasicScripts, AssetHelper.getDatatableJs());
    }

    addExcelBuilderJs() {
        this._addScript(this._customBasicScripts, AssetHelper.getExcelBuilderJs());
    }
    addPdfBuilderJs() {
        this._addScript(this._customBasicScripts, AssetHelper.getPdfBuilderJs());
    }
    addFeatureAssets(moduleName) {
        this._addStyle(this._featureStyles, AssetHelper.assetForCss(moduleName));
        this._addScript(this._featureScripts, AssetHelper.assetForJs(moduleName));
    }

    getAllScripts() {
        return this._basicScripts.concat(this._customBasicScripts, this._commonFeatureScripts, this._featureScripts);
    }

    getAllStyles() {
        return this._basicStyles.concat(this._featureStyles);
    }
}

module.exports = AssetManager;