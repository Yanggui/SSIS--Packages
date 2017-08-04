import React from "react";
import ReactDOM from "react-dom";
import { Spinner } from "mdc-neptune";
import contextManager from "../context/ContextManager";

const widgetLibraryList = [];

const getParamData = function (element, widgetId) {
    let paramData = element.getAttribute("data-params");
    if (paramData) {
        paramData = JSON.parse(paramData);
    }

    paramData = !paramData ? {} : paramData;
    paramData.contextId = contextManager.createContext({widgetId, request: paramData});
    return paramData;
};

const getInitialState = function (element) {
    let initialData = element.getAttribute("data-state");
    if (initialData) {
        initialData = JSON.parse(initialData);
    }

    return !initialData ? {} : initialData;
};

const renderWidgetInstance = (element, widget) => {
    if (element.getAttribute("data-render") === "ready") {
        return;
    }

    const paramData = getParamData(element, widget.id);
    const initialData = getInitialState(element);
    const widgetContent = widget.create(paramData, initialData);

    const isPromise = !(widgetContent.hasOwnProperty("component"));
    if (isPromise) {
        ReactDOM.render(React.createElement(Spinner, {style: {marginTop: "50px", marginBottom: "50px"}}), element);
        const createWidgetDom = (result) => {
            ReactDOM.unmountComponentAtNode(element);
            ReactDOM.render(result.component, element);
        };
        widgetContent.then(createWidgetDom);
    } else {
        ReactDOM.render(widgetContent.component, element);
    }

    element.setAttribute("data-render", "ready");
};

const renderWidget = (widget) => {
    if (widget.renderMode.toLowerCase() === "server") {
        return;
    }

    const elements = document.getElementsByClassName(`${widget.id}--widget`);
    if (elements.length < 1) {
        return;
    }

    for (let i = 0; i < elements.length; i++) {
        renderWidgetInstance(elements.item(i), widget);
    }
};

const doRender = function (widgets) {
    for (const widgetName in widgets) {
        renderWidget(widgets[widgetName]);
    }
};

const libNames = [];

const renderWidgets = function (widgets, libName) {
    if (libName) {
        if (libNames.indexOf(libName) < 0) {
            libNames.push(libName);
        } else {
            return;
        }
    }

    widgetLibraryList.push(widgets);
    doRender(widgets);
};

const renderPjaxWidgets = () => {
    widgetLibraryList.forEach((widgets) => {
        doRender(widgets);
    });
};


export default { renderWidgets };

export {renderPjaxWidgets};