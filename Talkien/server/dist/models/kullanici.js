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

var Kullanici = function () {
    function Kullanici(app) {
        _classCallCheck(this, Kullanici);

        this.app = app;
        this.kullanicilar = new _immutable.OrderedMap();
    }

    _createClass(Kullanici, [{
        key: 'arama',
        value: function arama() {
            var _this = this;

            var k = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";


            return new Promise(function (resolve, reject) {

                var regex = new RegExp(k, 'i');

                var sorgu = {
                    $or: [{ isim: { $regex: regex } }]
                };

                _this.app.db.collection('kullanicilar').find(sorgu, { _id: true, isim: true, tarih: true }).toArray(function (hata, sonuclar) {

                    if (hata || !sonuclar || !sonuclar.length) {

                        return reject({ Mesaj: "Kullanici bulunamadi !" });
                    }

                    return resolve(sonuclar);
                });
            });
        }
    }, {
        key: 'CERCATROVA',
        value: function CERCATROVA() {
            var _this2 = this;

            var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


            return new Promise(function (resolve, reject) {

                _this2.app.db.collection('kullanicilar').find(query, options).toArray(function (hata, kullanicilar) {

                    return hata ? reject(hata) : resolve(kullanicilar);
                });
            });
        }
    }, {
        key: 'yukle',
        value: function yukle(id) {
            var _this3 = this;

            id = '' + id;

            return new Promise(function (resolve, reject) {

                // cachede kullanici varsa databasede aramamiza gerek yok VIDEO 7

                var cachedekiKullanici = _this3.kullanicilar.get(id);

                if (cachedekiKullanici) {
                    // bulursak tamam

                    return resolve(cachedekiKullanici);
                }

                //bulamazsak databasede aricaksin kopek gibi

                //const kullanici ={herhangi: "birsey"};

                _this3.IdileKullaniciBul(id, function (hata, kullanici) {

                    if (!hata && kullanici) {
                        _this3.kullanicilar = _this3.kullanicilar.set(id, kullanici);
                    }
                    return hata ? reject(hata) : resolve(kullanici);
                });
            });
        }
    }, {
        key: 'KullaniciDurumunuGuncelle',
        value: function KullaniciDurumunuGuncelle(kullaniciId) {
            var _this4 = this;

            var onlimeMi = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


            return new Promise(function (resolve, reject) {

                _this4.kullanicilar = _this4.kullanicilar.update(kullaniciId, function (kullanici) {

                    if (kullanici) {
                        kullanici.online = onlimeMi;
                    }

                    return kullanici;
                });

                // let kullanici = this.kullanicilar.get(kullaniciId);
                //
                // if(kullanici){
                //      kullanici.online = true;
                // }
                //
                // this.kullanicilar = this.kullanicilar.set(kullaniciId , kullanici);

                var sorgu = {

                    _id: new _mongodb.ObjectID(kullaniciId)

                };

                var guncelle = {

                    $set: { online: onlimeMi }

                };

                _this4.app.db.collection('kullanicilar').update(sorgu, guncelle, function (hata, bilgi) {

                    if (hata) {

                        return reject(hata);
                    }

                    resolve(bilgi);
                });
            });
        }
    }, {
        key: 'giris',
        value: function giris(kullanici) {
            var _this5 = this;

            var isim = _lodash2.default.get(kullanici, 'isim', '');
            var password = _lodash2.default.get(kullanici, 'password', '');

            return new Promise(function (resolve, reject) {

                if (!password || !isim) {

                    return reject({ mesaj: "Login hatasi yavrum" });
                }

                _this5.isimIleKullaniciBul(isim, function (hata, result) {

                    if (hata) {
                        return reject({ mesaj: "Giris hatasi bebekim" });
                    }

                    var Gelenpassword = _lodash2.default.get(result, 'password');

                    var ParolaEslesti = void 0;

                    if (Gelenpassword > password) {

                        return reject({ mesaj: "Login hatasi parola eslesmedi" });
                    } else if (Gelenpassword < password) {
                        return reject({ mesaj: "Login hatasi parola eslesmedi" });
                    } else {
                        // bunada gerek yok aslinda
                        ParolaEslesti = true;
                    }

                    //console.log("Parola Eslesti :" , ParolaEslesti);
                    // giris basarili bebegim

                    var kullaniciId = result._id;

                    _this5.app.models.token.Yarat(kullaniciId).then(function (token) {

                        token.kullanici = result;

                        return resolve(token);
                    }).catch(function (hata) {

                        return reject({ mesaj: "Login hatasi !" });
                    });

                    //return resolve(result);
                });
            });
        }
    }, {
        key: 'isimIleKullaniciBul',
        value: function isimIleKullaniciBul(isim) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};


            this.app.db.collection('kullanicilar').findOne({ isim: isim }, function (hata, result) {

                if (hata || !result) {
                    return callback({ mesaj: "Kullanici bulunamadi aslanim" });
                }

                return callback(null, result);
            });
        }
    }, {
        key: 'IdileKullaniciBul',
        value: function IdileKullaniciBul(id) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};


            //console.log("Sorgu yapmaya basla");


            if (!id) {

                return callback({ mesaj: "Kullanici bulunamadi" }, null);
            }

            var kullaniciId = new _mongodb.ObjectID(id);
            this.app.db.collection('kullanicilar').findOne({ _id: kullaniciId }, function (hata, sonuc) {

                if (hata || !sonuc) {
                    return callback({ mesaj: "Kullanici bulunamadi" });
                }

                return callback(null, sonuc);
            });
        }
    }, {
        key: 'kaydetmedenOnce',
        value: function kaydetmedenOnce(kullanici) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};


            // kaydetmeden once kontrol et dogrumu degeler diye

            var hatalar = [];
            var kullanicibilgileri = ['isim', 'password'];
            var onayla = {
                isim: {
                    HataMesaji: 'Isim gereklidir',
                    do: function _do() {
                        var isim = _lodash2.default.get(kullanici, 'isim', '');
                        return isim.length;
                    }
                },

                /*email:{
                   HataMesaji:'Email girisiniz dogru degil !',
                    do: () =>{
                        const email = _.get(kullanici,'email', '');
                         if(!email.length || !emailmi(email)){
                            return false;
                        }
                         return true;
                    }
                },*/
                password: {
                    HataMesaji: 'Parola gerekli ve 2 karakterden fazla olmali',
                    do: function _do() {
                        var password = _lodash2.default.get(kullanici, 'password', '');

                        if (!password.length || password.length < 3) {
                            return false;
                        }
                        return true;
                    }
                }

            };

            //butun gerekli bilgileri donguye alip kontrol ediyoruz gecerlimi degilmi diye
            kullanicibilgileri.forEach(function (kullanicibilgileri) {
                var kullanicibilgdogrulama = _lodash2.default.get(onayla, kullanicibilgileri);
                if (kullanicibilgdogrulama) {

                    var gecerliMi = kullanicibilgdogrulama.do();
                    var msj = kullanicibilgdogrulama.HataMesaji;

                    if (!gecerliMi) {
                        hatalar.push(msj);
                    }
                }
            });

            if (hatalar.length) {
                var err = _lodash2.default.join(hatalar, ',');
                return callback(err, null);
            }

            // zaten varmi

            var isim = _lodash2.default.toLower(_lodash2.default.trim(_lodash2.default.get(kullanici, 'isim', '')));
            this.app.db.collection('kullanicilar').findOne({ isim: isim }, function (err, result) {

                if (err || result) {
                    return callback({ Message: "Isim zaten kayitli." }, null);
                }
                var password = _lodash2.default.get(kullanici, 'password');

                var FormatlanmisKullanici = {

                    isim: '' + _lodash2.default.trim(_lodash2.default.get(kullanici, 'isim')),
                    //email: email,
                    password: password,
                    tarih: new Date()

                };

                return callback(null, FormatlanmisKullanici);

                //console.log("kontrol " , err , result);
            });

            //return callback(null , kullanici);

        }
    }, {
        key: 'Yarat',
        value: function Yarat(kullanici) {
            var _this6 = this;

            var db = this.app.db;

            console.log("Kullanici :", kullanici);

            return new Promise(function (resolve, reject) {

                _this6.kaydetmedenOnce(kullanici, function (hata, kullanici) {

                    console.log("Onaylanma isleminden sonra :", hata, kullanici);

                    if (hata) {
                        return reject(hata);
                    }
                    //veritabanina yeni kullanici ekle fakat
                    db.collection('kullanicilar').insertOne(kullanici, function (hata, bilgi) {

                        // dogru ekliyor mu hata varmi
                        if (hata) {
                            return reject({ Mesaj: "Kayit sirasinda bir hata meydana geldi." });
                        }

                        var kullaniciId = _lodash2.default.get(kullanici, '_id').toString(); // userid string olsun OBJECT ID


                        _this6.kullanicilar = _this6.kullanicilar.set(kullaniciId, kullanici);

                        // hata yok
                        return resolve(kullanici);
                    });
                });
                //return reject("Kullanici bulunamadi !");

            });
        }
    }]);

    return Kullanici;
}();

exports.default = Kullanici;
//# sourceMappingURL=kullanici.js.map