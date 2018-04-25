'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _immutable = require('immutable');

var _mongodb = require('mongodb');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mesaj = function () {
    function Mesaj(app) {
        _classCallCheck(this, Mesaj);

        this.app = app;
        this.mesajlar = new _immutable.OrderedMap();
    }

    _createClass(Mesaj, [{
        key: 'yarat',
        value: function yarat(obje) {
            var _this = this;

            return new Promise(function (resolve, reject) {

                var id = _lodash2.default.get(obje, 'id', null);
                id = _lodash2.default.toString(id);

                var kullaniciId = new _mongodb.ObjectID(_lodash2.default.get(obje, 'KullaniciID'));
                var kanalId = new _mongodb.ObjectID(_lodash2.default.get(obje, 'kanalid'));

                var mesaj = {

                    _id: new _mongodb.ObjectID(id),
                    body: _lodash2.default.get(obje, 'body', ''),
                    kullaniciId: kullaniciId,
                    kanalId: kanalId,
                    tarih: new Date()

                };

                _this.app.db.collection('mesajlar').insertOne(mesaj, function (err, info) {

                    if (err) {
                        return reject(err);
                    }

                    //son mesaji guncelleyelim kanaldaki
                    _this.app.db.collection('kanallar').findOneAndUpdate({ _id: kanalId }, {

                        $set: {
                            sonMesaj: _lodash2.default.get(mesaj, 'body', ''),
                            guncellendi: new Date()
                        }

                    });

                    _this.app.models.kullanici.yukle(_lodash2.default.toString(kullaniciId)).then(function (kullanici) {

                        _lodash2.default.unset(kullanici, 'password');
                        mesaj.kullanici = kullanici;

                        return resolve(mesaj);
                    }).catch(function (err) {

                        return reject(err);
                    });
                });
            });
        }
    }, {
        key: 'KanalMesajlariniAl',
        value: function KanalMesajlariniAl(kanalId) {
            var _this2 = this;

            var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;
            var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;


            return new Promise(function (resolve, reject) {

                kanalId = new _mongodb.ObjectID(kanalId);
                /* this.app.db.collection('mesajlar').find({kanalId: kanalId}).skip(offset).limit(limit).toArray((hata , mesajlar) =>{
                       return hata ? reject(hata) : resolve(mesajlar);
                  });*/

                var query = [{

                    $lookup: {
                        from: 'kullanicilar',
                        localField: 'kullaniciId',
                        foreignField: '_id',
                        as: 'kullanici'
                    }
                }, {
                    $match: {
                        'kanalId': { $eq: kanalId }
                    }
                }, {
                    $project: {
                        _id: true,
                        kanalId: true,
                        kullanici: { _id: true, isim: true, tarih: true, online: true },
                        kullaniciId: true,
                        body: true,
                        tarih: true
                    }
                }, {

                    $project: {
                        _id: true,
                        kanalId: true,
                        kullanici: { $arrayElemAt: ['$kullanici', 0] },
                        kullaniciId: true,
                        body: true,
                        tarih: true
                    }
                }, {
                    $limit: limit
                }, {
                    $skip: offset
                }, {
                    $sort: { tarih: 1 }
                }];

                _this2.app.db.collection('mesajlar').aggregate(query, function (hata, sonuclar) {

                    return hata ? reject(hata) : resolve(sonuclar);
                });
            });
        }
    }]);

    return Mesaj;
}();

exports.default = Mesaj;
//# sourceMappingURL=mesaj.js.map