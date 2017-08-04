const cache = {};

const ONE_SECOND = 1000;
const ZERO_SECOND = 0;

class ApiClientCache {
    static put(key, value, ttlSeconds = ZERO_SECOND) {
        if (ttlSeconds <= ZERO_SECOND) {
            delete cache[key];
            return false;
        }

        const exp = Date.now() + ttlSeconds * ONE_SECOND;
        cache[key] = {value, exp};
        return true;
    }

    static get(key) {
        if (!key) {
            return null;
        }

        const data = cache[key];
        if (!data) {
            return null;
        }

        if (data.exp < Date.now()) {
            delete cache[key];
            return null;
        }

        return data.value;
    }
}

/**
 * Server side can only cache anonymous user's request, and data without permission check.
 * To be implemented.
 */
class ApiServerCache {
    static put() {
        return true;
    }

    static get() {
        return null;
    }
}

const ApiCache = __SERVER_RENDERING__ ? ApiServerCache : ApiClientCache;

export default ApiCache;