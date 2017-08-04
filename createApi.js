import contextManager from "../context/ContextManager";

const createApi = (ApiType, state) => {
    const instance = new ApiType();
    const contextId = state && state.contextId;
    if (contextId) {
        instance.apiClient.contextId = contextId; // assign current request contextId
        const context = contextManager.getContext(contextId);
        if (context && context.request && context.request.auth && context.request.auth.user) {
            const user = context.request.auth.user;
            instance.apiClient.extData = { "user_name": user.userName };
        }
    }

    if (!__SERVER_RENDERING__) {
        const searchStrToArray = location.search.slice(1).split("&");
        const searchStrToObj = {};
        searchStrToArray.map((queryStr) => {
            const queryStrToArray = queryStr.split("=");
            searchStrToObj[queryStrToArray[0]] = queryStrToArray[1];
        });
        const userName = searchStrToObj.user_name;
        instance.apiClient.extData = { "user_name": userName };
    }

    return instance;
};

export default (ApiType, state) => {
    try {
        return createApi(ApiType, state);
    } catch (ex) {
        console.error(ex);
        return {};
    }
};