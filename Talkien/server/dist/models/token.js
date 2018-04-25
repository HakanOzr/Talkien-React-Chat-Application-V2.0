'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _mongodb = require('mongodb');

var _immutable = require('immutable');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Token = function () {
    function Token(app) {
        _classCallCheck(this, Token);

        this.app = app;
        this.tokenler = new _immutable.OrderedMap();
    }

    _createClass(Token, [{
        key: 'yukle',
        value: function yukle() {
            var _this = this;

            var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;


            id = '' + id;

            return new Promise(function (resolve, reject) {

                //cache'e bak eger varsa databasede aramamiza gerek yok

                var cachetoken = _this.tokenler.get(id);
                if (cachetoken) {
                    return resolve(cachetoken);
                }

                _this.IdileTokenBul(id, function (hata, token) {

                    if (!hata && token) {
                        var tokenId = '' + token._id;
                        _this.tokenler = _this.tokenler.set(tokenId, token);
                    }
                    return hata ? reject(hata) : resolve(token);
                });
            });
        }
    }, {
        key: 'cikis',
        value: function cikis(token) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {

                var tokenId = _lodash2.default.toString(token._id);
                // to remove token from cache
                _this2.tokenler = _this2.tokenler.remove(tokenId);
                // we have to delete this token id from tokens collection

                _this2.app.db.collection('tokenler').remove({ _id: new _mongodb.ObjectID(tokenId) }, function (hata, bilgi) {

                    return hata ? reject(hata) : resolve(bilgi);
                });
            });
        }
    }, {
        key: 'tokenVekullaniciYukle',
        value: function tokenVekullaniciYukle(id) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {

                _this3.yukle(id).then(function (token) {

                    //console.log("git tqweqweqweqweoken" , token);

                    var kullaniciId = '' + token.kullaniciId;
                    _this3.app.models.kullanici.yukle(kullaniciId).then(function (kullanici) {

                        token.kullanici = kullanici;
                        return resolve(token);
                    }).catch(function (hata) {

                        return reject(hata);
                    });
                }).catch(function (hata) {

                    return reject(hata);
                });
            });
        }
    }, {
        key: 'IdileTokenBul',
        value: function IdileTokenBul(id) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};


            //console.log("DB de sorguya basla biktimmmm");


            var idObject = new _mongodb.ObjectID(id);
            var sorgu = { _id: idObject };
            this.app.db.collection('tokenler').findOne(sorgu, function (hata, sonuc) {

                if (hata || !sonuc) {

                    return callback({ Mesaj: "Bulunamadi" }, null);
                }

                return callback(null, sonuc);
            });
        }
    }, {
        key: 'Yarat',
        value: function Yarat(kullaniciId) {
            var _this4 = this;

            var token = {
                kullaniciId: kullaniciId,
                tarih: new Date()

            };

            return new Promise(function (resolve, reject) {

                _this4.app.db.collection('tokenler').insertOne(token, function (hata, bilgi) {

                    return hata ? reject(hata) : resolve(token);
                });
            });
        }
    }]);

    return Token;
}();

exports.default = Token;
//# sourceMappingURL=token.js.map