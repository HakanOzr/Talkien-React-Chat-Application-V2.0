import _ from 'lodash'
import {toString} from "../helper";
import {ObjectID} from 'mongodb'
import {OrderedMap} from 'immutable'

export default class Kanal{

    constructor(app){
        this.app=app;
        this.kanallar = new OrderedMap();
    }


    yarat(obje){

       //let id = toString(_.get(obje  , '_id'));

            return new Promise((resolve , reject) => {


                let id = toString(_.get(obje  , '_id'));
                
                let idObjesi = id ? new ObjectID(id) : new ObjectID();

                let uyeler =[];


                _.each(_.get(obje , 'uyeler' ,[]), (deger , anahtar) =>{

                    //console.log("Anahtar", anahtar , deger);
                    const uyeObjectId= new ObjectID(anahtar);
                    uyeler.push(uyeObjectId);

                });

                let ObjeKullaniciId = null;

                let kullaniciId = _.get(obje, 'kullaniciId' , null);

                if(kullaniciId){
                    ObjeKullaniciId = new ObjectID(kullaniciId);
                }

                const kanal = {
                    _id : idObjesi,
                    ad : _.get(obje , 'ad',''),
                    sonMesaj : _.get(obje , 'sonMesaj',''),
                    tarih : new Date(),
                    kullaniciId : ObjeKullaniciId,
                    uyeler : uyeler,
                };

                this.app.db.collection('kanallar').insertOne(kanal , (hata , bilgi)=>{

                    if(!hata){
                        const kanalId = kanal._id.toString();
                        this.kanallar = this.kanallar.set(kanalId , kanal);


                    }
                    return hata ? reject(hata) : resolve(kanal);
                });

            });

    }

    yukle(id){

        return new Promise((resolve , reject) =>{


            id = _.toString(id);
            // ilk olarak onbellekte bul

            const OnbellekKanal = this.kanallar.get(id);

            if(OnbellekKanal){

                return resolve(OnbellekKanal);

            }

            //onbellekte yoksa dbe bakicaz aslan

            this.IdIleBul(id).then((c)=>{
                this.kanallar = this.kanallar.set(id , c);

                return resolve(c);

            }).catch((err) =>{

                return reject(err);

            })


        })


    }

    bul(q , secenekler={}){

                //console.log(q);

            return new Promise((resolve, reject ) =>{


               this.app.db.collection('kanallar').find(q , secenekler).toArray((err , results) =>{

                   return err ? reject(err) : resolve(results);


               });


            });

    }

    aggregate(q){


return new Promise((resolve , reject ) =>{


this.app.db.collection('kanallar').aggregate(q , (hata , sonuc) =>{

            return hata ?  reject(hata) : resolve(sonuc);

});


})


    }


    IdIleBul(id){

       return new Promise((resolve , reject) =>{

           this.app.db.collection('kanallar').findOne({_id : new ObjectID(id)}, (err , result) =>{

               if(err || !result){
                   return reject(err ? err : "Bulunamadi");
               }

               return resolve(result);
           });


       })
    }



}