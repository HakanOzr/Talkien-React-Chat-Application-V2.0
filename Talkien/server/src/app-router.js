import moment from 'moment';
import _ from 'lodash';


export const START_TIME = new Date();
export default class AppRouter{


    constructor(app){

        this.app = app;
        this.RouterKur=this.RouterKur.bind(this);

        this.RouterKur();
    }

    RouterKur(){

        const app = this.app;

        console.log("Uygulama Router fonksiyonel durumda !");


        /**
         * @endpoint /api/kullanicilar
         * @method: POST
         **/

        app.post('/api/kullanicilar',(req , res , next) =>{

            const body = req.body;

            app.models.kullanici.Yarat(body).then((kullanici) =>{

                _.unset(kullanici , 'password');

                return res.status(200).json(kullanici);

            }).catch(err =>{

                return res.status(503).json({error: err});
            })



        });

        /**
         * @endpoint /api/kullanicilar/arama
         * @method: POST
         **/

        app.post('/api/kullanicilar/arama' , (req , res , next) =>{

            const anahtar_kelime =_.get(req ,'body.arama' , '');



            app.models.kullanici.arama(anahtar_kelime).then((sonuclar) =>{



                return res.status(200).json(sonuclar);
            }).catch((hata)=>{

                return res.status(404).json({

                    hata : 'Bulunamadi.',
                })


            })


        });




        /**
         * @endpoint /api/kullanicilar/ben
         * @method: GET
         **/
        app.get('/api/kullanicilar/ben' , (req , res , next) =>{

            let tokenId = req.get('authorization');

            if(!tokenId){
                //sorguyla token alma
                tokenId =_.get(req , 'query.auth');
            }

            app.models.token.tokenVekullaniciYukle(tokenId).then((token) =>{

                _.unset(token, 'kullanici.password');
                return res.json(token);



            }).catch(hata =>{


                return res.status(401).json({
                    hata: hata,
                })

            });






        });




        /**
         * @endpoint /api/kullanicilar/:id
         * @method: GET
         **/

        app.get('/api/kullanicilar/:id' , (req , res , next) => {

            const kullaniciId = _.get(req , 'params.id' );

            //return res.json({hi :'there'});

           app.models.kullanici.yukle(kullaniciId).then((kullanici) =>{

               _.unset(kullanici , 'password'); // sifreyi databasede gostermemek icin ne yazarsam onu goremem

               return res.status(200).json(kullanici);

            }).catch(hata => {

                return res.status(404).json({
                    hata:hata,
                })
            })


        });

        /**
         * @endpoint /api/kullanicilar/giris
         * @method: POST
         **/

            app.post('/api/kullanicilar/giris' , (req , res , next) => {

                const body = _.get( req , 'body');
                //return res.json(body)

                app.models.kullanici.giris(body).then((token) => { // isin yoksa login olustur kullanici.jsde


                    //console.log("Su kadar kullanici var :);
                    return res.status(200).json(token);



                }).catch(hata => {

                    return res.status(401).json({
                        hata: hata
                    })
                })

            });


        /**
         * @endpoint /api/kanallar/:id
         * @method: GET
         **/

        app.get('/api/kanallar/:id',(req , res , next) => {

            const kanalId = _.get(req, 'params.id');

            console.log(kanalId);

            if(!kanalId){

                return res.status(404).json({error: {mesaj: "Not found."}});

            }

            app.models.kanal.yukle(kanalId).then((kanal) => {

                const uyeler = kanal.uyeler;
                const query ={

                    _id: {$in: uyeler}

                };
                const options = { _id: 1 , isim: 1 , tarih : 1};

                app.models.kullanici.CERCATROVA(query , options).then((kullanicilar)=>{

                    kanal.kullanicilar = kullanicilar;
                    return res.status(200).json(kanal);

                }).catch(err =>{

                    return res.status(404).json({error: {mesaj: "Not found."}});
                });




            }).catch((err) =>{

                return res.status(404).json({error: {mesaj: "Not found."}});

            })

        });

        /**
         * @endpoint /api/ben/kanallar
         * @method: GET
         **/

        app.get('/api/ben/kanallar', (req , res , next) => {


            let tokenId = req.get('authorization');

            if(!tokenId){
                //sorguyla token alma
                tokenId =_.get(req, 'query.auth');
            }

            app.models.token.tokenVekullaniciYukle(tokenId).then((token) => {


                const kullaniciId = token.kullaniciId;


                const query = [

                    {
                        $lookup: {
                            from: 'kullanicilar',
                            localField: 'uyeler',
                            foreignField: '_id',
                            as: 'kullanicilar',
                        }
                    },
                    {
                        $match: {
                            uyeler: {$all: [kullaniciId]}
                        }
                    },
                    {
                        $project: {
                            _id: true,
                            ad: true,
                            sonMesaj: true,
                            tarih: true,
                            guncellendi:true,
                            kullaniciId: true,
                            kullanicilar: {
                                _id: true,
                                isim: true,
                                tarih: true,
                                online:true,
                            },
                            uyeler: true,
                        }
                    },
                    {
                        $sort: {guncellendi: -1 , tarih: 1}
                    },
                    {
                        $limit: 50,
                    }
                ];


                app.models.kanal.aggregate(query).then((kanallar) =>{

                return res.status(200).json(kanallar);


                }).catch((err) =>{


                    return res.status(404).json({err :{mesaj : "Bulunamadi"}});
                });



                //return res.json(token);



            }).catch(hata =>{


                return res.status(401).json({
                    hata: "Erisim izniniz kibarca reddedildi kibarca ama",
                })

            });



        });


        /**
         * @endpoint /api/kanallar/:id/mesajlar
         * @method: GET
         **/

        app.get('/api/kanallar/:id/mesajlar', (req , res , next) =>{

            let filtre = _.get(req, 'query.filtre', null);
            if (filtre) {

                filtre = JSON.parse(filtre);
                console.log(filtre);
            }

            const kanalId = _.toString(_.get(req, 'params.id'));
            const limit = _.get(filtre, 'limit', 50);
            const offset = _.get(filtre, 'offset', 0);

            //kullanici login midir dostum
            // kullanici kanalin uyesimi
            this.app.models.mesaj.KanalMesajlariniAl(kanalId , limit , offset).then((mesajlar)=>{


                return res.status(200).json(mesajlar);


            }).catch((hata) =>{

                return res.status(400).json({hata :{mesaj : "Bulunamadi"}});
            })




        });

        /**
         * @endpoint /api/ben/cikis
         * @method: GET
         **/

        app.get('/api/ben/cikis', (req, res, next) => {

            let tokenId = req.get('authorization');

            if (!tokenId) {
                // get token from query

                tokenId = _.get(req, 'query.auth');
            }


            app.models.token.tokenVekullaniciYukle(tokenId).then((token) => {


                app.models.token.cikis(token);

                return res.status(200).json({
                    message: 'Basarili.'
                });

            }).catch(hata => {


                return res.status(401).json({error: {message: 'Izin reddedildi'}});
            })



        })


    }

}