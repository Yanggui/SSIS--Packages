export const ActionTypes = { INIT: "@@redux/INIT" };

export const createAction = function (type, ...argNames) {
    const actionCreator = function (...args) {
        const action = { type };
        argNames.forEach((arg, index) => {
            action[argNames[index]] = args[index];
        });
        return action;
    };
    Object.assign(actionCreator, {
        toString: () => type,
        id: type,
        type,
        argNames
    });
    return actionCreator;
};

export const makeActionCreator = createAction;

/* asyncAction */
export const asyncActions = {
    request: createAction("@@mdy/REQUEST"),
    success: createAction("@@mdy/SUCCESS", "data"),
    failure: createAction("@@mdy/FAILURE", "error")
};

export const createActionsBy = function (baseActions, subType, ...extraArgNames) {
    const actions = {};
    Object.keys(baseActions).forEach((actionName) => {
        const baseAction = baseActions[actionName];
        const type = `${ baseAction.type }/${ subType }`;
        actions[actionName] = createAction(type, ...baseAction.argNames, ...extraArgNames);
    });
    return actions;
};

export const createAsyncAction = function (api, type, ...argNames) {
    const actions = createActionsBy(asyncActions, type, ...argNames);
    const asyncAction = function (...args) {
        return (dispatch, getState) => {
            dispatch(actions.request(...args));
            return api(getState(), ...args)
                .then((response) => {
                    if (response.success) {
                        dispatch(actions.success(response.data, ...args));
                    } else {
                        const errorInfo = response;
                        dispatch(actions.failure(errorInfo, ...args));
                        console.log(errorInfo, type, argNames, args);
                    }
                    return response;
                }, (error) => {
                    const errorInfo = {success: false, error};
                    dispatch(actions.failure(errorInfo, ...args));
                    console.log(errorInfo, type, argNames, args);
                    return errorInfo;
                });
        };
    };
    Object.assign(asyncAction, actions);
    return asyncAction;
};

// multiple actions sent, only handle the response of the last action.
export const createSingletonAction = function (api, type, ...argNames) {
    let latestRequestTimestamp = 0;
    const actions = createActionsBy(asyncActions, type, ...argNames);
    const asyncAction = function (...args) {

        return (dispatch, getState) => {
            const requestTimestamp = new Date().getTime();
            latestRequestTimestamp = requestTimestamp;

            dispatch(actions.request(...args));
            return api(getState(), ...args)
                .then((response) => {
                    if (latestRequestTimestamp !== requestTimestamp) {
                        // drop the response
                        return {};
                    }

                    if (response.success) {
                        dispatch(actions.success(response.data, ...args));
                    } else {
                        const errorInfo = response;
                        dispatch(actions.failure(errorInfo, ...args));
                        console.log(errorInfo, type, argNames, args);
                    }
                    return response;
                }, (error) => {
                    const errorInfo = {success: false, error};
                    dispatch(actions.failure(errorInfo, ...args));
                    console.log(errorInfo, type, argNames, args);
                    return errorInfo;
                });
        };
    };
    Object.assign(asyncAction, actions);
    return asyncAction;
};
/* end of asyncAction */

/* reducer utils */
export const createReducer = function (initialState, handlers = {}) {
    const reducer = function (state = initialState, action) {
        if (handlers.hasOwnProperty(action.type)) {
            return handlers[action.type](state, action);
        }
        if (handlers.hasOwnProperty("default")) {
            return handlers.default(state, action);
        } else {
            return state;
        }
    };
    Object.assign(reducer, {
        initialState,
        handlers
    });
    return reducer;
};

export const createReducerBy = function (baseReducer = {}, actionsMap = {}) {
    const typeMap = {};
    Object.keys(actionsMap).forEach((key) => {
        typeMap[key] = actionsMap[key].toString();
    });

    const newHandlers = {};
    const baseHandlers = baseReducer.handlers;
    Object.keys(baseHandlers).forEach((actionType) => {
        if (typeMap[actionType]) {
            newHandlers[typeMap[actionType]] = baseHandlers[actionType];
        } else {
            newHandlers[actionType] = baseHandlers[actionType];
        }
    });
    return createReducer(baseReducer.initialState, newHandlers);
};

export const reduceReducers = function (...reducers) {
    return (previous, current) =>
        reducers.reduce(
            (p, r) => r(p, current),
            previous
        );
};

export const combineReducers = function (reducers) {
    const reducerKeys = Object.keys(reducers);
    const finalReducers = {};
    for (let i = 0; i < reducerKeys.length; i++) {
        const key = reducerKeys[i];
        if (typeof reducers[key] === "function") {
            finalReducers[key] = reducers[key];
        }
    }
    const finalReducerKeys = Object.keys(finalReducers);

    return function combination(state = {}, action) {
        let hasChanged = false;
        const nextState = {};
        for (let i = 0; i < finalReducerKeys.length; i++) {
            const key = finalReducerKeys[i];
            const reducer = finalReducers[key];
            const previousStateForKey = state[key];
            // if state shape not match, ignore current reducer
            if (typeof previousStateForKey === "undefined" &&
                (action.type !== "@@redux/INIT" && action.type !== "@@INIT")) {
                return state;
            }
            const nextStateForKey = reducer(previousStateForKey, action);
            nextState[key] = nextStateForKey;
            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }
        return hasChanged ? nextState : state;
    };
};
/* end of reducer utils */