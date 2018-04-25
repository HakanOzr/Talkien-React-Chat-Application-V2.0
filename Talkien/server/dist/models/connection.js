'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _immutable = require('immutable');

var _mongodb = require('mongodb');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Connection = function () {
    function Connection(app) {
        _classCallCheck(this, Connection);

        this.app = app;

        this.connections = (0, _immutable.OrderedMap)();

        this.modelDidLoad();
    }

    _createClass(Connection, [{
        key: 'modelDidLoad',
        value: function modelDidLoad() {
            var _this = this;

            //console.log("Connection class initilazed.");
            var counter = 0;

            this.app.wss.on('connection', function (ws) {

                counter++;

                setInterval(function () {

                    console.log("Servera baglanan kisi sayisi : ", counter);
                }, 15000);

                var socketID = new _mongodb.ObjectID().toString();

                var istemciBaglantisi = {

                    _id: '' + socketID,
                    ws: ws,
                    kullaniciId: null,
                    yetkilendirildi: false

                };
                // baglantiyi cachede sakla
                _this.connections = _this.connections.set(socketID, istemciBaglantisi);

                //ws.send("Merhaba there your ID : " + socketID);


                ws.on('message', function (msj) {

                    //console.log("SERVER : MESSAGE FROM CLIENT" , msj)
                    var mesaj = _this.gelenMesajiCevir(msj);

                    _this.userWithTokenID(socketID, mesaj);

                    //console.log("SERVER : MESSAGE FROM CLIENT" , msj);
                });

                //console.log("Biri websocket ile baglandi.",);

                ws.on('close', function () {

                    counter--;

                    //console.log("Birisi serverdan cikti !" , socketID);
                    var baglantiyiKapat = _this.connections.get(socketID);
                    var kullaniciId = _lodash2.default.toString(_lodash2.default.get(baglantiyiKapat, 'kullaniciId', null));

                    _this.connections = _this.connections.remove(socketID);

                    if (kullaniciId) {
                        //kullaniciId ile eslesen butun soketleri bul
                        var kullaniciBaglantilari = _this.connections.filter(function (con) {
                            return _lodash2.default.toString(_lodash2.default.get(con, 'kullaniciId')) === kullaniciId;
                        });

                        if (kullaniciBaglantilari.size === 0) {
                            //bu kullaniciId ile online olan yok.yani kullanici offline demek

                            _this.sendToMembers(kullaniciId, {

                                eylem: 'kullanici_offline',
                                yuk: kullaniciId
                            });

                            _this.app.models.kullanici.KullaniciDurumunuGuncelle(kullaniciId, false);
                        }
                    }
                });
            });
        }
    }, {
        key: 'yolla',
        value: function yolla(ws, obje) {
            // send

            var mesaj = JSON.stringify(obje);

            ws.send(mesaj);
        }
    }, {
        key: 'userWithTokenID',
        value: function userWithTokenID(socketID, msj) {
            var _this2 = this;

            // dotheJOB

            var eylem = _lodash2.default.get(msj, 'eylem'); //yetkilendirmede yapiyor asil isleri yapan fonk bu diyrbiliriz
            var yuk = _lodash2.default.get(msj, 'yuk');
            var KullaniciBaglantisi = this.connections.get(socketID);

            switch (eylem) {

                case 'mesaj_yarat':

                    if (KullaniciBaglantisi.yetkilendirildi) {
                        var mesajObjesi = yuk;

                        mesajObjesi.kullaniciId = _lodash2.default.get(KullaniciBaglantisi, 'kullaniciId');

                        //console.log("Istemciden yeni mesaj yaratmak icin istegi aldim! ", yuk);

                        this.app.models.mesaj.yarat(mesajObjesi).then(function (mesaj) {

                            //console.log("Mesaj basarili bir sekilde olusturuldu" , mesaj);

                            var kanalId = _lodash2.default.toString(_lodash2.default.get(mesaj, 'kanalId'));

                            _this2.app.models.kanal.yukle(kanalId).then(function (kanal) {

                                //console.log("BISEYLER BISEYLER! ", `${kullaniciId.length}`);

                                var uyeIdleri = _lodash2.default.get(kanal, 'uyeler', []);

                                _lodash2.default.each(uyeIdleri, function (uyeId) {

                                    uyeId = _lodash2.default.toString(uyeId);

                                    var uyeBaglantisi = _this2.connections.filter(function (x) {
                                        return _lodash2.default.toString(x.kullaniciId) === uyeId;
                                    });

                                    uyeBaglantisi.forEach(function (baglanti) {

                                        var ws = baglanti.ws;

                                        _this2.yolla(ws, {

                                            eylem: 'mesaj_eklendi',
                                            yuk: mesaj

                                        });
                                    });
                                });
                            });

                            // const kullaniciId = _.toString(mesaj.kullaniciId);
                            // this.app.models.kullanici.yukle(kullaniciId).then((kullanici) => {
                            //
                            //     _.unset(kullanici , 'password'); // parola gizle
                            //     mesaj.kullanici = kullanici;
                            //
                            //     console.log("Mesaj basarili bir sekilde olusturuldu" , mesaj);
                            //
                            //     // kanaldaki herkese geri gonder
                            //
                            // });

                            //mesaj olusturuldu
                        }).catch(function (err) {

                            var ws = KullaniciBaglantisi.ws;
                            _this2.yolla(ws, {

                                eylem: 'mesaj_yaratma_hatasi',
                                yuk: yuk
                            });
                        });
                    }

                    break;

                case 'kanal_yarat':

                    var kanal = yuk;

                    var kullaniciId = KullaniciBaglantisi.kullaniciId;

                    kanal.kullaniciId = kullaniciId;

                    this.app.models.kanal.yarat(kanal).then(function (kanalObjesi) {

                        //kanal yaratma basarili
                        //console.log("Kanal yaratma basarili " , typeof kullaniciId, kanalObjesi);

                        var uyeIDleri = _lodash2.default.get(kanalObjesi, 'uyeler', []);

                        //uye idsi olan butun kullanicilari yakala

                        var sorgu = {

                            _id: { $in: uyeIDleri }

                        };

                        var sorguSecenekleri = {
                            _id: 1,
                            isim: 1,
                            tarih: 1

                        };

                        _this2.app.models.kullanici.CERCATROVA(sorgu, sorguSecenekleri).then(function (kullanicilar) {
                            kanalObjesi.kullanicilar = kullanicilar;

                            _lodash2.default.each(uyeIDleri, function (id) {

                                var kullaniciId = id.toString();
                                var uyeBaglantilari = _this2.connections.filter(function (con) {
                                    return '' + con.kullaniciId === kullaniciId;
                                });

                                if (uyeBaglantilari.size) {
                                    uyeBaglantilari.forEach(function (con) {
                                        var ws = con.ws;
                                        var obje = {
                                            eylem: 'kanal_eklendi',
                                            yuk: kanalObjesi
                                        };
                                        // userid si eslesen soket istemciye gonderiyorum EP9
                                        _this2.yolla(ws, obje);
                                    });
                                    //console.log(uyeBaglantilari);
                                }
                            });
                        });

                        //const uyeBaglantilari = this.connections.filter((con)=> `${con.kullaniciId}`)

                    });
                    //console.log("Istemci yeni bir kanal yaratmak istiyor", kanal);


                    break;
                case 'yetki':

                    var kullaniciTokenId = yuk;
                    var baglanti = this.connections.get(socketID);

                    if (baglanti) {

                        this.app.models.token.tokenVekullaniciYukle(kullaniciTokenId).then(function (token) {

                            var kullaniciId = token.kullaniciId;
                            baglanti.yetkilendirildi = true;
                            baglanti.kullaniciId = '' + kullaniciId;

                            _this2.connections = _this2.connections.set(socketID, baglanti);

                            // istemciye yetkilendirildigini gonder
                            var obje = {
                                eylem: 'Yetkilendirme Basarili',
                                yuk: 'Yetkilendirildin.'
                            };
                            _this2.yolla(baglanti.ws, obje);

                            var kullaniciIdSTR = _lodash2.default.toString(kullaniciId);
                            _this2.sendToMembers(kullaniciIdSTR, {
                                eylem: 'kullanici_online',
                                yuk: kullaniciIdSTR
                            });

                            _this2.app.models.kullanici.KullaniciDurumunuGuncelle(kullaniciIdSTR, true);
                        }).catch(function (hata) {

                            var obje = {
                                eylem: 'Yetkilendirme Hatasi',
                                yuk: "Hesabinizi yetkilendiremedik :" + kullaniciTokenId

                            };
                            _this2.yolla(baglanti.ws, obje);
                        });
                    }

                    //console.log("User with token ID is :" , kullaniciTokenId, typeof  kullaniciTokenId);

                    break;

                default:
                    break;

            }
        }
    }, {
        key: 'hepsineYolla',
        value: function hepsineYolla(obje) {
            var _this3 = this;

            // send all


            // send socket messages to all clients.

            this.connections.forEach(function (con, key) {
                var ws = con.ws;

                _this3.yolla(ws, obje);
            });
        }
    }, {
        key: 'gelenMesajiCevir',
        value: function gelenMesajiCevir(msj) {
            // decodeMesasas

            var mesajObjesi = null;

            try {
                mesajObjesi = JSON.parse(msj);
            } catch (hata) {
                console.log("Socket mesajini decode edemedik", msj);
            }

            return mesajObjesi;
        }
    }, {
        key: 'sendToMembers',
        value: function sendToMembers(kullaniciId, obje) {
            var _this4 = this;

            var query = [{
                $match: {

                    uyeler: { $all: [new _mongodb.ObjectID(kullaniciId)] }
                }
            }, {

                $lookup: {

                    from: 'kullanicilar',
                    localField: 'uyeler',
                    foreignField: '_id',
                    as: 'kullanicilar'
                }
            }, {
                $unwind: {

                    path: '$kullanicilar'
                }
            }, {
                $match: { 'kullanicilar.online': { $eq: true } }
            }, {
                $group: {

                    _id: "$kullanicilar._id"
                }
            }];

            var kullanicilar = [];

            this.app.db.collection('kanallar').aggregate(query, function (err, results) {

                // console.log("found members array who is chattting with current user", results);
                if (err === null && results) {

                    _lodash2.default.each(results, function (result) {

                        var uid = _lodash2.default.toString(_lodash2.default.get(result, '_id'));
                        if (uid) {
                            kullanicilar.push(uid);
                        }
                    });

                    // this is list of all connections is chatting with current user
                    var UyeBaglantilari = _this4.connections.filter(function (con) {
                        return _lodash2.default.includes(kullanicilar, _lodash2.default.toString(_lodash2.default.get(con, 'kullaniciId')));
                    });
                    if (UyeBaglantilari.size) {

                        UyeBaglantilari.forEach(function (connection, key) {

                            var ws = connection.ws;
                            _this4.yolla(ws, obje);
                        });
                    }
                }
            });
        }
    }]);

    return Connection;
}();

exports.default = Connection;
//# sourceMappingURL=connection.js.map