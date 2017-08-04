
class ContextManager {
    constructor() {
        let contextStore = null;
        if (__SERVER_RENDERING__) {
            if (!global.contextStore) {
                global.contextStore = {};
            }
            contextStore = global.contextStore;
        } else {
            contextStore = {};
        }

        this.store = contextStore;
    }

    createContext(data) {
        let contextId = null;
        if (__SERVER_RENDERING__) {
            contextId = data.request.id;
        } else {
            contextId = 0;
        }

        this.store[contextId] = data;
        return contextId;
    }

    getConext(contextId) {
        return this.store[contextId];
    }

    getContext(contextId) {
        return this.store[contextId];
    }

    removeContext(contextId) {
        delete this.store[contextId];
    }
}

const contextManager = new ContextManager();

export default contextManager;
export {contextManager};