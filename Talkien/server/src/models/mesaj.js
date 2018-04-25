import _ from 'lodash';
import {OrderedMap} from 'immutable';
import {ObjectID} from 'mongodb';

export default class Mesaj {

    constructor(app) {
        this.app = app;
        this.mesajlar = new OrderedMap();


    }

    yarat(obje) {


       return new Promise((resolve , reject) =>{


           let id = _.get(obje , 'id' , null);
           id = _.toString(id);

           const kullaniciId = new ObjectID(_.get(obje , 'KullaniciID'));
           const kanalId = new ObjectID(_.get(obje , 'kanalid'));

           const mesaj ={

               _id: new ObjectID(id),
               body: _.get(obje, 'body' , ''),
               kullaniciId: kullaniciId,
               kanalId: kanalId,
               tarih: new Date(),

           };

           this.app.db.collection('mesajlar').insertOne(mesaj,(err , info) =>{

               if(err){
                   return reject(err);

               }

               //son mesaji guncelleyelim kanaldaki
               this.app.db.collection('kanallar').findOneAndUpdate({_id:kanalId},{

                   $set:{
                       sonMesaj: _.get(mesaj, 'body', ''),
                       guncellendi: new Date(),
                   }




               });

               this.app.models.kullanici.yukle(_.toString(kullaniciId)).then((kullanici) =>{

                   _.unset(kullanici , 'password');
                   mesaj.kullanici=kullanici;

                   return resolve(mesaj);

               }).catch((err)=>{

                   return reject(err);

               });


           });



       });

    }


    KanalMesajlariniAl(kanalId , limit = 50, offset = 0){



            return new Promise((resolve , reject) =>{


                kanalId= new ObjectID(kanalId);
               /* this.app.db.collection('mesajlar').find({kanalId: kanalId}).skip(offset).limit(limit).toArray((hata , mesajlar) =>{


                    return hata ? reject(hata) : resolve(mesajlar);

                });*/

                const query = [
                    {

                        $lookup: {
                            from: 'kullanicilar',
                            localField: 'kullaniciId',
                            foreignField: '_id',
                            as: 'kullanici'
                        }
                    },
                    {
                        $match: {
                            'kanalId': {$eq: kanalId},
                        },
                    },
                    {
                        $project: {
                            _id: true,
                            kanalId: true,
                            kullanici: {_id: true, isim: true, tarih: true, online: true},
                            kullaniciId: true,
                            body: true,
                            tarih: true,
                        }
                    },
                    {

                        $project: {
                            _id: true,
                            kanalId: true,
                            kullanici: {$arrayElemAt: ['$kullanici', 0]},
                            kullaniciId: true,
                            body: true,
                            tarih: true,
                        }
                    },

                    {
                        $limit: limit
                    },
                    {
                        $skip: offset,
                    },
                    {
                        $sort: {tarih: 1}
                    }


                ];

               this.app.db.collection('mesajlar').aggregate(query,(hata , sonuclar)=>{

                   return hata ? reject(hata) : resolve(sonuclar);

               });

            })


    }

}