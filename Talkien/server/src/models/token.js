import _ from 'lodash'
import {ObjectID} from 'mongodb'
import {OrderedMap} from 'immutable'

export default class Token{



    constructor(app){

        this.app = app;
        this.tokenler = new OrderedMap();

    }

    yukle(id = null){

        id = `${id}`;


        return new Promise((resolve , reject) =>{

            //cache'e bak eger varsa databasede aramamiza gerek yok

            const cachetoken = this.tokenler.get(id);
            if(cachetoken){
                return resolve(cachetoken);
            }

        this.IdileTokenBul(id , (hata , token) =>{

            if(!hata && token){
                const tokenId = `${token._id}`;
                this.tokenler = this.tokenler.set(tokenId , token);
            }
            return hata ? reject(hata) : resolve(token);


        });

        })

    }

    cikis(token){

        return new Promise((resolve, reject) => {

            const tokenId = _.toString(token._id);
            // tokenleri onbellekten siliyom
            this.tokenler = this.tokenler.remove(tokenId);


            this.app.db.collection('tokenler').remove({_id: new ObjectID(tokenId)}, (hata, bilgi) => {

                return hata ? reject(hata) : resolve(bilgi);
            });

        })

    }

    tokenVekullaniciYukle(id){

        return new Promise((resolve , reject) =>{

                        this.yukle(id).then((token) => {

                            //console.log("git tqweqweqweqweoken" , token);

                         const kullaniciId = `${token.kullaniciId}`;
                         this.app.models.kullanici.yukle(kullaniciId).then((kullanici) =>{

                            token.kullanici = kullanici;
                            return resolve(token);


                          }).catch(hata =>{

                             return reject(hata);

                          });

           }).catch((hata) => {

            return reject(hata);

            });


            });

    }

    IdileTokenBul(id , callback = () => {}){

        //console.log("DB de sorguya basla biktimmmm");


        const idObject = new ObjectID(id);
        const sorgu = {_id : idObject};
        this.app.db.collection('tokenler').findOne(sorgu ,(hata , sonuc ) =>{

            if(hata || !sonuc){

                return callback({Mesaj : "Bulunamadi"} , null);

            }

            return callback(null , sonuc);


        })



    }

    Yarat(kullaniciId){



        const token ={
            kullaniciId : kullaniciId,
            tarih : new Date(),

        };


        return new Promise((resolve , reject) =>{

            this.app.db.collection('tokenler').insertOne(token , (hata , bilgi) =>{

                return hata ? reject(hata) : resolve(token);
        })
    })
    }



}