const uaParser = require("ua-parser-js");

const MIN_CHROME_VERSION = 50;
const MIN_FIREFOX_VERSION = 52;

const isEs6Browser = (request) => {
    const uaString = request.headers["user-agent"];
    if (uaString) {
        const ua = uaParser(uaString);
        const browser = ua.browser;
        const browserVersion = parseInt(browser.version);
        if (browser.name === "Chrome" && browserVersion > MIN_CHROME_VERSION) {
            return true;
        }
        if (browser.name === "Firefox" && browserVersion >= MIN_FIREFOX_VERSION) {
            return true;
        }
    }

    return false;
};

module.exports = {isEs6Browser};