"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var emailmi = exports.emailmi = function emailmi(email) {

    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return regex.test(email);
};

var toString = exports.toString = function toString() {
    var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";


    return "" + id;
};
//# sourceMappingURL=helper.js.map