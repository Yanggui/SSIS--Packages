class BaseService {
    constructor(contextId) {
        this.contextId = contextId;
    }

    createErrorResult(code, message) {
        return {success: false, error: {code, message}};
    }

    createResult(data) {
        return {success: true, data};
    }
}


export default BaseService;