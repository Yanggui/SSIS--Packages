import ClientEventEmitter from "./ClientEventEmitter";
import EventName from "./EventName";
import _ from "lodash";

const showAlert = (message, name = null, icon = null) => {
    name = name ? name : _.now().toString();
    ClientEventEmitter.emit(EventName.showTopMessage, {name, message, icon});
    return () => {
        ClientEventEmitter.emit(EventName.hideTopMessage, {name});
    };
};

const dismissAlert = (name) => {
    ClientEventEmitter.emit(EventName.hideTopMessage, {name});
};

const switchScorecard = (isShown) => {
    ClientEventEmitter.emit(EventName.showScorecard, {isShown});
};

export default {showAlert, dismissAlert, switchScorecard};