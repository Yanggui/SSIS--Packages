import axios from "axios";

const axiosInstance = axios.create({baseURL: "/"});

const _makeServerCall = (name, args, contextId, featureName) => {
    const serviceName = `${featureName}~${name}`;
    const service = global.services[serviceName];
    if (!service) {
        const error = { code: 500, message: `Cannot find service ${serviceName}` };
        return Promise.resolve({success: false, error});
    }

    return service(args, contextId);
};

const _makeClientCall = (name, args, featureName) => {
    const url = `/services/${featureName}?name=${name}`;
    const jsonData = JSON.stringify({data: args});
    return axiosInstance.post(url, jsonData, {headers: {"Content-Type": "application/json"}})
            .then((result) => {
                return result.data;
            });
};

const callService = (serviceName, args, contextId, featureName) => {
    if (__SERVER_RENDERING__) {
        return _makeServerCall(serviceName, args, contextId, featureName);
    } else {
        return _makeClientCall(serviceName, args, featureName);
    }
};

export default {
    callService
};