import {OrderedMap} from 'immutable'
import {ObjectID} from 'mongodb'
import _ from 'lodash'

export default class Connection {


    constructor(app) {

        this.app = app;

        this.connections = OrderedMap();

        this.modelDidLoad();
    }

    modelDidLoad() {

        //console.log("Baglanti classi baslastildi vallaha biktim.");
        let counter = 0;

        this.app.wss.on('connection', (ws) => {

            counter++;

            setInterval(()=>{


                console.log("Servera baglanan kisi sayisi : " , counter);


            }, 15000);



            const socketID = new ObjectID().toString();


            const istemciBaglantisi = {


                _id: `${socketID}`,
                ws: ws,
                kullaniciId: null,
                yetkilendirildi: false,


            };
            // baglantiyi cachede sakla
            this.connections = this.connections.set(socketID, istemciBaglantisi);


            //ws.send("Merhaba iste IDniz : " + socketID);


            ws.on('message', (msj) => {


                const mesaj = this.gelenMesajiCevir(msj);

                this.userWithTokenID(socketID, mesaj);


            });



            //console.log("Biri websocket ile baglandi.",);

            ws.on('close', () => {

                counter--;

                //console.log("Birisi serverdan cikti !" , socketID);
                const baglantiyiKapat = this.connections.get(socketID);
                const kullaniciId=_.toString(_.get(baglantiyiKapat , 'kullaniciId' , null));


                this.connections = this.connections.remove(socketID);

                if(kullaniciId){
                    //kullaniciId ile eslesen butun soketleri bul
                    const kullaniciBaglantilari = this.connections.filter((con)=> _.toString(_.get(con , 'kullaniciId')) === kullaniciId);

                    if(kullaniciBaglantilari.size === 0){
                        //bu kullaniciId ile online olan yok.yani kullanici offline demek

                        this.sendToMembers(kullaniciId,{

                            eylem:'kullanici_offline',
                            yuk: kullaniciId
                        });


                        this.app.models.kullanici.KullaniciDurumunuGuncelle(kullaniciId , false);

                    }

                }


            });


        })


    }

    yolla(ws, obje) {

        const mesaj = JSON.stringify(obje);

        ws.send(mesaj);


    }


    userWithTokenID(socketID, msj) {

        const eylem = _.get(msj, 'eylem'); //yetkilendirmede yapiyor asil isleri yapan fonk bu diyrbiliriz
        const yuk = _.get(msj, 'yuk');
        const KullaniciBaglantisi = this.connections.get(socketID);

        switch (eylem) {


            case 'mesaj_yarat':

                if(KullaniciBaglantisi.yetkilendirildi){
                    let mesajObjesi = yuk;

                    mesajObjesi.kullaniciId = _.get(KullaniciBaglantisi, 'kullaniciId');

                    //console.log("Istemciden yeni mesaj yaratmak icin istegi aldim! ", yuk);

                    this.app.models.mesaj.yarat(mesajObjesi).then((mesaj) => {

                        //console.log("Mesaj basarili bir sekilde olusturuldu" , mesaj);

                        const kanalId = _.toString(_.get(mesaj , 'kanalId'));

                        this.app.models.kanal.yukle(kanalId).then((kanal)=>{

                     //console.log("BISEYLER BISEYLER! ", `${kullaniciId.length}`);

                     const uyeIdleri = _.get(kanal , 'uyeler' , []);

                     _.each(uyeIdleri, (uyeId) =>{

                         uyeId = _.toString(uyeId);

                         const uyeBaglantisi = this.connections.filter((x) => _.toString(x.kullaniciId) === uyeId);

                        uyeBaglantisi.forEach((baglanti) =>{

                            const ws = baglanti.ws;

                            this.yolla(ws , {

                                eylem : 'mesaj_eklendi',
                                yuk : mesaj,

                            })


                        })
                     });


                        })

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

                    }).catch(err => {

                        const ws = KullaniciBaglantisi.ws;
                        this.yolla(ws, {

                            eylem: 'mesaj_yaratma_hatasi',
                            yuk: yuk,
                        })
                    })
                }

                break;

            case 'kanal_yarat':

                let kanal = yuk;


                const kullaniciId = KullaniciBaglantisi.kullaniciId;

                kanal.kullaniciId = kullaniciId;


                this.app.models.kanal.yarat(kanal).then((kanalObjesi) => {

                    //kanal yaratma basarili
                    //console.log("Kanal yaratma basarili " , typeof kullaniciId, kanalObjesi);

                    const uyeIDleri = _.get(kanalObjesi, 'uyeler', []);

                    //uye idsi olan butun kullanicilari yakala

                    const sorgu = {

                        _id: {$in: uyeIDleri}

                    };

                    const sorguSecenekleri = {
                        _id: 1,
                        isim: 1,
                        tarih: 1,


                    };


                    this.app.models.kullanici.CERCATROVA(sorgu, sorguSecenekleri).then((kullanicilar) => {
                        kanalObjesi.kullanicilar = kullanicilar;


                        _.each(uyeIDleri, (id) => {

                            const kullaniciId = id.toString();
                            const uyeBaglantilari = this.connections.filter((con) => `${con.kullaniciId}` === kullaniciId);

                            if (uyeBaglantilari.size) {
                                uyeBaglantilari.forEach((con) => {
                                    const ws = con.ws;
                                    const obje = {
                                        eylem: 'kanal_eklendi',
                                        yuk: kanalObjesi,
                                    };
                                    // userid si eslesen soket istemciye gonderiyorum
                                    this.yolla(ws, obje);

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

                const kullaniciTokenId = yuk;
                const baglanti = this.connections.get(socketID);

                if (baglanti) {


                    this.app.models.token.tokenVekullaniciYukle(kullaniciTokenId).then((token) => {

                        const kullaniciId = token.kullaniciId;
                        baglanti.yetkilendirildi = true;
                        baglanti.kullaniciId = `${kullaniciId}`;

                        this.connections = this.connections.set(socketID, baglanti);



                        // istemciye yetkilendirildigini gonder
                        const obje = {
                            eylem: 'Yetkilendirme Basarili',
                            yuk: 'Yetkilendirildin.'
                        };
                        this.yolla(baglanti.ws, obje);

                        const kullaniciIdSTR = _.toString(kullaniciId);
                        this.sendToMembers(kullaniciIdSTR, {
                            eylem: 'kullanici_online',
                            yuk: kullaniciIdSTR,
                        });


                        this.app.models.kullanici.KullaniciDurumunuGuncelle(kullaniciIdSTR , true);


                    }).catch((hata) => {

                        const obje = {
                            eylem: 'Yetkilendirme Hatasi',
                            yuk: "Hesabinizi yetkilendiremedik :" + kullaniciTokenId


                        };
                        this.yolla(baglanti.ws, obje);


                    })


                }




                break;


            default:
                break;


        }
    }

    hepsineYolla(obje) {


        // send socket messages to all clients.

        this.connections.forEach((con, key) => {
            const ws = con.ws;

            this.yolla(ws, obje);
        });
    }



    gelenMesajiCevir(msj) {

        let mesajObjesi = null;

        try {
            mesajObjesi = JSON.parse(msj);
        }
        catch (hata) {
            console.log("Socket mesajini decode edemedik", msj)
        }


        return mesajObjesi;


    }

    sendToMembers(kullaniciId, obje) {

        const query = [
            {
                $match: {

                    uyeler: {$all: [new ObjectID(kullaniciId)]}
                }
            },
            {

                $lookup: {

                    from: 'kullanicilar',
                    localField: 'uyeler',
                    foreignField: '_id',
                    as: 'kullanicilar'
                }
            },
            {
                $unwind: {

                    path: '$kullanicilar'
                }
            },
            {
                $match: {'kullanicilar.online': {$eq: true}}
            },
            {
                $group: {

                    _id: "$kullanicilar._id"
                }
            }


        ];


        const kullanicilar = [];


        this.app.db.collection('kanallar').aggregate(query, (err, results) => {



            if (err === null && results) {

                _.each(results, (result) => {


                    const uid = _.toString(_.get(result, '_id'));
                    if (uid) {
                        kullanicilar.push(uid);
                    }
                });


                // kullaniciyla konusan herkesin baglantilari
                const UyeBaglantilari = this.connections.filter((con) => _.includes(kullanicilar, _.toString(_.get(con, 'kullaniciId'))));
                if (UyeBaglantilari.size) {

                    UyeBaglantilari.forEach((connection, key) => {

                        const ws = connection.ws;
                        this.yolla(ws, obje);
                    });
                }


            }
        })
    }

}