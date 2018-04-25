'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _helper = require('../helper');

var _mongodb = require('mongodb');

var _immutable = require('immutable');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Kanal = function () {
    function Kanal(app) {
        _classCallCheck(this, Kanal);

        this.app = app;
        this.kanallar = new _immutable.OrderedMap();
    }

    _createClass(Kanal, [{
        key: 'yarat',
        value: function yarat(obje) {
            var _this = this;

            //let id = toString(_.get(obje  , '_id'));

            return new Promise(function (resolve, reject) {

                var id = (0, _helper.toString)(_lodash2.default.get(obje, '_id'));

                var idObjesi = id ? new _mongodb.ObjectID(id) : new _mongodb.ObjectID();

                var uyeler = [];

                _lodash2.default.each(_lodash2.default.get(obje, 'uyeler', []), function (deger, anahtar) {

                    //console.log("Anahtar", anahtar , deger);
                    var uyeObjectId = new _mongodb.ObjectID(anahtar);
                    uyeler.push(uyeObjectId);
                });

                var ObjeKullaniciId = null;

                var kullaniciId = _lodash2.default.get(obje, 'kullaniciId', null);

                if (kullaniciId) {
                    ObjeKullaniciId = new _mongodb.ObjectID(kullaniciId);
                }

                var kanal = {
                    _id: idObjesi,
                    ad: _lodash2.default.get(obje, 'ad', ''),
                    sonMesaj: _lodash2.default.get(obje, 'sonMesaj', ''),
                    tarih: new Date(),
                    kullaniciId: ObjeKullaniciId,
                    uyeler: uyeler
                };

                _this.app.db.collection('kanallar').insertOne(kanal, function (hata, bilgi) {

                    if (!hata) {
                        var kanalId = kanal._id.toString();
                        _this.kanallar = _this.kanallar.set(kanalId, kanal);
                    }
                    return hata ? reject(hata) : resolve(kanal);
                });
            });
        }
    }, {
        key: 'yukle',
        value: function yukle(id) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {

                id = _lodash2.default.toString(id);
                // ilk olarak onbellekte bul

                var OnbellekKanal = _this2.kanallar.get(id);

                if (OnbellekKanal) {

                    return resolve(OnbellekKanal);
                }

                //onbellekte yoksa dbe bakicaz aslan

                _this2.IdIleBul(id).then(function (c) {
                    _this2.kanallar = _this2.kanallar.set(id, c);

                    return resolve(c);
                }).catch(function (err) {

                    return reject(err);
                });
            });
        }
    }, {
        key: 'bul',
        value: function bul(q) {
            var _this3 = this;

            var secenekler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


            //console.log(q);

            return new Promise(function (resolve, reject) {

                _this3.app.db.collection('kanallar').find(q, secenekler).toArray(function (err, results) {

                    return err ? reject(err) : resolve(results);
                });
            });
        }
    }, {
        key: 'aggregate',
        value: function aggregate(q) {
            var _this4 = this;

            return new Promise(function (resolve, reject) {

                _this4.app.db.collection('kanallar').aggregate(q, function (hata, sonuc) {

                    return hata ? reject(hata) : resolve(sonuc);
                });
            });
        }
    }, {
        key: 'IdIleBul',
        value: function IdIleBul(id) {
            var _this5 = this;

            return new Promise(function (resolve, reject) {

                _this5.app.db.collection('kanallar').findOne({ _id: new _mongodb.ObjectID(id) }, function (err, result) {

                    if (err || !result) {
                        return reject(err ? err : "Bulunamadi");
                    }

                    return resolve(result);
                });
            });
        }
    }]);

    return Kanal;
}();

exports.default = Kanal;
//# sourceMappingURL=kanal.js.map