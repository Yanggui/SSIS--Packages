import axios from "axios";
import ReactDOM from "react-dom";
import ClientEventEmitter from "../event/ClientEventEmitter";
import {renderPjaxWidgets} from "./ClientRenderer";
import EventName from "../event/EventName";
import _ from "lodash";

const loadingHtml = `<div class="loading-container"><div class="loading-image"></div></div>`;

const buildPjaxRequest = function (url) {
    return axios.get(url, {headers: {"X-PJAX": "1"}});
};

const isScriptExists = (url) => {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length; i--;) {
        if (_.endsWith(scripts[i].src, url)) {
            return true;
        }
    }
    return false;
};

const isLinkExists = (url) => {
    const links = document.getElementsByTagName("link");
    for (let i = links.length; i--;) {
        if (_.endsWith(links[i].href, url)) {
            return true;
        }
    }
    return false;
};

const addCssToPage = function (styles) {
    styles.forEach((styleUrl) => {
        if (isLinkExists(styleUrl)) {
            return;
        }
        const linkElement = document.createElement("link");
        linkElement.type = "text/css";
        linkElement.rel = "stylesheet";
        linkElement.href = styleUrl;
        document.head.appendChild(linkElement);
    });
};

const addScriptToPage = function (scripts) {
    scripts.forEach((scriptUrl) => {
        if (isScriptExists(scriptUrl)) {
            return;
        }
        const scriptElement = document.createElement("script");
        scriptElement.src = scriptUrl;
        document.head.appendChild(scriptElement);
    });
};

const handleResult = (data, anchor) => {
    if (!data) {
        return;
    }

    if (data.content) {
        anchor.innerHTML = data.content;
    }

    if (data.title) {
        document.title = data.title;
    }

    addCssToPage(data.styles);
    addScriptToPage(data.scripts);
    renderPjaxWidgets();
};

const render = function (url) {
    const anchor = document.getElementById("pjax-container");

    const unmountApps = function () {
        const appContainers = anchor.getElementsByClassName("mdc-app");
        for (let i = 0; i < appContainers.length; i++) {
            const container = appContainers[i];
            ReactDOM.unmountComponentAtNode(container);
        }
    };

    const setHtmlContent = function (html) {
        anchor.innerHTML = html;
    };

    unmountApps();
    setHtmlContent(loadingHtml);

    buildPjaxRequest(url).then((result) => {
        if (!window.location.href.endsWith(url)) {
            return;
        }

        handleResult(result.data, anchor);
    });
};

const initPjax = function () {
    ClientEventEmitter.on(EventName.pjaxUpdate, (event) => {
        console.log(event);
        render(event.url);
    });

    window.onpopstate = function (event) {
        console.log(event);
        render(document.location.href);
    };
};

export default {initPjax};
