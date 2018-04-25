'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.START_TIME = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var START_TIME = exports.START_TIME = new Date();

var AppRouter = function () {
    function AppRouter(app) {
        _classCallCheck(this, AppRouter);

        this.app = app;
        this.RouterKur = this.RouterKur.bind(this);

        this.RouterKur();
    }

    _createClass(AppRouter, [{
        key: 'RouterKur',
        value: function RouterKur() {
            var _this = this;

            var app = this.app;

            console.log("Uygulama Router fonksiyonel durumda !");

            /**
             * @endpoint /api/kullanicilar
             * @method: POST
             **/

            app.post('/api/kullanicilar', function (req, res, next) {

                var body = req.body;

                app.models.kullanici.Yarat(body).then(function (kullanici) {

                    _lodash2.default.unset(kullanici, 'password');

                    return res.status(200).json(kullanici);
                }).catch(function (err) {

                    return res.status(503).json({ error: err });
                });
            });

            /**
             * @endpoint /api/kullanicilar/arama
             * @method: POST
             **/

            app.post('/api/kullanicilar/arama', function (req, res, next) {

                var anahtar_kelime = _lodash2.default.get(req, 'body.arama', '');

                app.models.kullanici.arama(anahtar_kelime).then(function (sonuclar) {

                    return res.status(200).json(sonuclar);
                }).catch(function (hata) {

                    return res.status(404).json({

                        hata: 'Bulunamadi.'
                    });
                });
            });

            /**
             * @endpoint /api/kullanicilar/ben
             * @method: GET
             **/
            app.get('/api/kullanicilar/ben', function (req, res, next) {

                var tokenId = req.get('authorization');

                if (!tokenId) {
                    //sorguyla token alma
                    tokenId = _lodash2.default.get(req, 'query.auth');
                }

                app.models.token.tokenVekullaniciYukle(tokenId).then(function (token) {

                    _lodash2.default.unset(token, 'kullanici.password');
                    return res.json(token);
                }).catch(function (hata) {

                    return res.status(401).json({
                        hata: hata
                    });
                });
            });

            /**
             * @endpoint /api/kullanicilar/:id
             * @method: GET
             **/

            app.get('/api/kullanicilar/:id', function (req, res, next) {

                var kullaniciId = _lodash2.default.get(req, 'params.id');

                //return res.json({hi :'there'});

                app.models.kullanici.yukle(kullaniciId).then(function (kullanici) {

                    _lodash2.default.unset(kullanici, 'password'); // sifreyi databasede gostermemek icin ne yazarsam onu goremem

                    return res.status(200).json(kullanici);
                }).catch(function (hata) {

                    return res.status(404).json({
                        hata: hata
                    });
                });
            });

            /**
             * @endpoint /api/kullanicilar/giris
             * @method: POST
             **/

            app.post('/api/kullanicilar/giris', function (req, res, next) {

                var body = _lodash2.default.get(req, 'body');
                //return res.json(body)

                app.models.kullanici.giris(body).then(function (token) {
                    // isin yoksa login olustur kullanici.jsde


                    //console.log("Su kadar kullanici var :);
                    return res.status(200).json(token);
                }).catch(function (hata) {

                    return res.status(401).json({
                        hata: hata
                    });
                });
            });

            /**
             * @endpoint /api/kanallar/:id
             * @method: GET
             **/

            app.get('/api/kanallar/:id', function (req, res, next) {

                var kanalId = _lodash2.default.get(req, 'params.id');

                console.log(kanalId);

                if (!kanalId) {

                    return res.status(404).json({ error: { mesaj: "Not found." } });
                }

                app.models.kanal.yukle(kanalId).then(function (kanal) {

                    var uyeler = kanal.uyeler;
                    var query = {

                        _id: { $in: uyeler }

                    };
                    var options = { _id: 1, isim: 1, tarih: 1 };

                    app.models.kullanici.CERCATROVA(query, options).then(function (kullanicilar) {

                        kanal.kullanicilar = kullanicilar;
                        return res.status(200).json(kanal);
                    }).catch(function (err) {

                        return res.status(404).json({ error: { mesaj: "Not found." } });
                    });
                }).catch(function (err) {

                    return res.status(404).json({ error: { mesaj: "Not found." } });
                });
            });

            /**
             * @endpoint /api/ben/kanallar
             * @method: GET
             **/

            app.get('/api/ben/kanallar', function (req, res, next) {

                var tokenId = req.get('authorization');

                if (!tokenId) {
                    //sorguyla token alma
                    tokenId = _lodash2.default.get(req, 'query.auth');
                }

                app.models.token.tokenVekullaniciYukle(tokenId).then(function (token) {

                    var kullaniciId = token.kullaniciId;

                    var query = [{
                        $lookup: {
                            from: 'kullanicilar',
                            localField: 'uyeler',
                            foreignField: '_id',
                            as: 'kullanicilar'
                        }
                    }, {
                        $match: {
                            uyeler: { $all: [kullaniciId] }
                        }
                    }, {
                        $project: {
                            _id: true,
                            ad: true,
                            sonMesaj: true,
                            tarih: true,
                            guncellendi: true,
                            kullaniciId: true,
                            kullanicilar: {
                                _id: true,
                                isim: true,
                                tarih: true,
                                online: true
                            },
                            uyeler: true
                        }
                    }, {
                        $sort: { guncellendi: -1, tarih: 1 }
                    }, {
                        $limit: 50
                    }];

                    app.models.kanal.aggregate(query).then(function (kanallar) {

                        return res.status(200).json(kanallar);
                    }).catch(function (err) {

                        return res.status(404).json({ err: { mesaj: "Bulunamadi" } });
                    });

                    //return res.json(token);

                }).catch(function (hata) {

                    return res.status(401).json({
                        hata: "Erisim izniniz kibarca reddedildi kibarca ama"
                    });
                });
            });

            /**
             * @endpoint /api/kanallar/:id/mesajlar
             * @method: GET
             **/

            app.get('/api/kanallar/:id/mesajlar', function (req, res, next) {

                var filtre = _lodash2.default.get(req, 'query.filtre', null);
                if (filtre) {

                    filtre = JSON.parse(filtre);
                    console.log(filtre);
                }

                var kanalId = _lodash2.default.toString(_lodash2.default.get(req, 'params.id'));
                var limit = _lodash2.default.get(filtre, 'limit', 50);
                var offset = _lodash2.default.get(filtre, 'offset', 0);

                //kullanici login midir dostum
                // kullanici kanalin uyesimi
                _this.app.models.mesaj.KanalMesajlariniAl(kanalId, limit, offset).then(function (mesajlar) {

                    return res.status(200).json(mesajlar);
                }).catch(function (hata) {

                    return res.status(400).json({ hata: { mesaj: "Bulunamadi" } });
                });
            });

            /**
             * @endpoint /api/ben/cikis
             * @method: GET
             **/

            app.get('/api/ben/cikis', function (req, res, next) {

                var tokenId = req.get('authorization');

                if (!tokenId) {
                    // get token from query

                    tokenId = _lodash2.default.get(req, 'query.auth');
                }

                app.models.token.tokenVekullaniciYukle(tokenId).then(function (token) {

                    app.models.token.cikis(token);

                    return res.status(200).json({
                        message: 'Basarili.'
                    });
                }).catch(function (hata) {

                    return res.status(401).json({ error: { message: 'Izin reddedildi' } });
                });
            });
        }
    }]);

    return AppRouter;
}();

exports.default = AppRouter;
//# sourceMappingURL=app-router.js.map