import React from "react";
import _ from "lodash";
import { Provider } from "react-redux";
import { createStore, applyMiddleware, compose, combineReducers } from "redux";
import createLogger from "redux-logger";
import thunk from "redux-thunk";

const isProd = () => {
    return process.env.NODE_ENV === "production";
};

const createReduxStore = (rootReducer, initialState) => {
    if (__SERVER_RENDERING__ || isProd()) {
        const middlewares = [thunk];
        return createStore(rootReducer, initialState, applyMiddleware(...middlewares));
    } else {
        const middlewares = [thunk, createLogger()];
        let enhancer = null;
        if (window.devToolsExtension) {
            enhancer = compose(applyMiddleware(...middlewares), window.devToolsExtension());
        } else {
            enhancer = applyMiddleware(...middlewares);
        }

        return createStore(rootReducer, initialState, enhancer);
    }
};

const createReduxWidget = function (WidgetView, store) {
    const component = (
        <Provider store={store}>
            <WidgetView />
        </Provider>);
    return { component, store: store.getState() };
};

export const createReduxApp = function (WidgetView, rootReducer, initialAction) {
    return function (params, initialState) {
        let wrappedReducer = null;
        if (typeof rootReducer === "function") {
            wrappedReducer = (state, action) => {
                const newState = rootReducer(state, action);
                if (!newState.contextId) {
                    return _.assign({}, newState, { contextId: params.contextId });
                }

                return newState;
            };
        } else {
            const contextIdReducer = (state) => {
                if (!_.isNil(state)) {
                    return state;
                } else {
                    return params.contextId;
                }
            };
            rootReducer.contextId = contextIdReducer;
            wrappedReducer = combineReducers(rootReducer);
        }

        const store = createReduxStore(wrappedReducer, initialState);

        const initialized = !_.isEmpty(initialState);
        if (!initialized && initialAction) {
            return initialAction(params)(store.dispatch, store.getState).then(() => {
                return createReduxWidget(WidgetView, store);
            });
        } else {
            return createReduxWidget(WidgetView, store);
        }
    };
};