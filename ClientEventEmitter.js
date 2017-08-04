import EventEmitter from "eventemitter3";

const emitter = new EventEmitter();

const on = function (type, listener, context) {
    if (__SERVER_RENDERING__) {
        return false;
    }

    return emitter.on(type, listener, context);
};

const emit = function (type, a1, a2, a3, a4, a5) {
    if (__SERVER_RENDERING__) {
        return false;
    }

    return emitter.emit(type, a1, a2, a3, a4, a5);
};

const removeListener = function (type, listener) {
    if (__SERVER_RENDERING__) {
        return false;
    }

    return emitter.removeListener(type, listener);
};

export default {on, emit, removeListener};

if (!__SERVER_RENDERING__) {
    if (window) {
        window.eventEmitter = emitter;
    }
}