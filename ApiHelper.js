import axios from "axios";
import ApiCache from "./ApiCache";

const ZERO_SECOND = 0;

const createConfig = function () {
    let baseUrl;
    if (__SERVER_RENDERING__) {
        if (global.webConfig.publicConfig) {
            baseUrl = global.webConfig.publicConfig.serviceUrl;
        } else {
            baseUrl = global.webConfig.api.serviceUrl;
        }
    } else {
        baseUrl = document.getElementById("dataConfig").getAttribute("data-url");
    }

    return {
        baseURL: baseUrl
    };
};

let axiosInstance = null;

const getAxios = function () {
    if (axiosInstance === null) {
        axiosInstance = axios.create(createConfig());
    }

    return axiosInstance;
};

const getResultData = function (result) {
    // jest throw NetworkError while require bluebird, so lazy load it
    /* eslint-disable global-require */
    const Promise = require("bluebird");
    return Promise.resolve(result.data);
};

class ApiHelper {
    static get(url, ttlSeconds = ZERO_SECOND) {
        const result = ApiCache.get(url);
        if (result) {
            return result.then(getResultData);
        }

        const dataPromise = getAxios().get(url);
        ApiCache.put(url, dataPromise, ttlSeconds);
        return dataPromise.then((value) => {
            return getResultData(value);
        });
    }

    static post(url, data) {
        const jsonData = JSON.stringify(data);
        return getAxios().post(url, jsonData, {headers: {"Content-Type": "application/json"}})
            .then(getResultData);
    }

    static put(url, data) {
        const jsonData = JSON.stringify(data);
        return getAxios().put(url, jsonData, {headers: {"Content-Type": "application/json"}})
            .then(getResultData);
    }

    static delete(url) {
        return getAxios().delete(url, { headers: { "Content-Type": "application/json"} })
            .then(getResultData);
    }
}

export default ApiHelper;