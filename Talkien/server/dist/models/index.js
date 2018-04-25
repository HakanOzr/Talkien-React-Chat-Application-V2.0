'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _kullanici = require('./kullanici');

var _kullanici2 = _interopRequireDefault(_kullanici);

var _token = require('./token');

var _token2 = _interopRequireDefault(_token);

var _connection = require('./connection');

var _connection2 = _interopRequireDefault(_connection);

var _kanal = require('./kanal');

var _kanal2 = _interopRequireDefault(_kanal);

var _mesaj = require('./mesaj');

var _mesaj2 = _interopRequireDefault(_mesaj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Model = function Model(app) {
    _classCallCheck(this, Model);

    this.app = app;

    this.kullanici = new _kullanici2.default(app);
    this.token = new _token2.default(app);
    this.connection = new _connection2.default(app);
    this.kanal = new _kanal2.default(app);
    this.mesaj = new _mesaj2.default(app);
};

exports.default = Model;
//# sourceMappingURL=index.js.map