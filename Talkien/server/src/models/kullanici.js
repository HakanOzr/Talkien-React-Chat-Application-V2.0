import _ from 'lodash'
import {emailmi} from '../helper'
import {ObjectID} from 'mongodb'
import {OrderedMap} from 'immutable'

export default class Kullanici{

    constructor(app){

        this.app = app;
        this.kullanicilar = new OrderedMap();


    }


    arama(k= ""){

        return new Promise((resolve , reject) =>{


            const regex = new RegExp(k , 'i');

            const sorgu = {
                $or:[
                    {isim :{$regex: regex}},
                    //{email :{$regex: regex}},
                ],
            };

            this.app.db.collection('kullanicilar').find(sorgu, {_id :true , isim :true , tarih:true}).toArray((hata , sonuclar)=>{


                if (hata || !sonuclar || !sonuclar.length){

                    return reject({Mesaj : "Kullanici bulunamadi !"});

                }

                return resolve(sonuclar);

            })


        })





    }

    CERCATROVA(query ={} , options ={}){

        return new Promise((resolve , reject) =>{

            this.app.db.collection('kullanicilar').find(query , options).toArray((hata , kullanicilar)=>{

                return hata ? reject(hata) : resolve(kullanicilar);



            })




        });



    }


    yukle(id){

        id = `${id}`;

        return new Promise((resolve , reject) =>{

            // cachede kullanici varsa databasede aramamiza gerek yok VIDEO 7

            const cachedekiKullanici = this.kullanicilar.get(id);

            if(cachedekiKullanici){   // bulursak tamam

                return resolve(cachedekiKullanici)
            }

            //bulamazsak databasede aricaksin kopek gibi

            //const kullanici ={herhangi: "birsey"};

            this.IdileKullaniciBul(id , (hata , kullanici) =>{

                if(!hata && kullanici){
                    this.kullanicilar = this.kullanicilar.set(id, kullanici);
                }
               return hata ? reject(hata) : resolve(kullanici);

            });



        })



    }

    KullaniciDurumunuGuncelle(kullaniciId, onlimeMi=false){

       return new Promise((resolve , reject) =>{



           this.kullanicilar = this.kullanicilar.update(kullaniciId , (kullanici) =>{

              if(kullanici){
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

           const sorgu={

           _id: new ObjectID(kullaniciId),

           };

           const guncelle = {

               $set:{online:onlimeMi},

           };




           this.app.db.collection('kullanicilar').update(sorgu , guncelle,(hata , bilgi) =>{



               if(hata){

                   return reject(hata);
               }

               resolve(bilgi);



           })



       })

    }

    giris(kullanici){

        const isim = _.get(kullanici , 'isim' , '');
        const password = _.get(kullanici , 'password' , '');

        return new Promise((resolve , reject) => {



            if(!password || !isim){

                return reject({mesaj : "Login hatasi yavrum"})

            }

            this.isimIleKullaniciBul(isim , (hata , result) =>{

                if(hata){
                    return reject({mesaj : "Giris hatasi bebekim"});
                }



                const Gelenpassword =_.get(result , 'password');

                let ParolaEslesti;

                if(Gelenpassword > password){

                    return reject({mesaj : "Login hatasi parola eslesmedi"});

                } else if( Gelenpassword < password){
                    return reject({mesaj : "Login hatasi parola eslesmedi"});
                }

                else{   // bunada gerek yok aslinda
                    ParolaEslesti=true;
                }




                //console.log("Parola Eslesti :" , ParolaEslesti);
                // giris basarili bebegim

                const kullaniciId = result._id;

                this.app.models.token.Yarat(kullaniciId).then((token) =>{

                    token.kullanici = result;

                    return resolve(token);

                }).catch(hata => {

                    return reject({mesaj : "Login hatasi !"});
                })

                //return resolve(result);

            })


        });



    }

    isimIleKullaniciBul(isim , callback = () => {}){


        this.app.db.collection('kullanicilar').findOne({isim : isim}, (hata , result) => {

            if(hata || !result){
                return callback({mesaj : "Kullanici bulunamadi aslanim"})
            }

            return callback(null , result);

        });

}

    IdileKullaniciBul(id,callback = () => {

    }){

        //console.log("Sorgu yapmaya basla");


        if(!id){

            return callback({mesaj: "Kullanici bulunamadi"} , null);

        }




        const kullaniciId = new ObjectID(id);
        this.app.db.collection('kullanicilar').findOne({_id: kullaniciId}, (hata , sonuc)=>{

            if(hata || !sonuc){
                return callback({mesaj: "Kullanici bulunamadi"});
            }

            return callback(null, sonuc);


        });



    }

    kaydetmedenOnce(kullanici , callback =() =>{}){

// kaydetmeden once kontrol et dogrumu degeler diye

        let hatalar = [];
        const kullanicibilgileri = ['isim' , 'password'];
        const onayla = {
            isim:{
                HataMesaji: 'Isim gereklidir',
                do: () =>{
                    const isim = _.get(kullanici,'isim', '');
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
             password:{
                 HataMesaji: 'Parola gerekli ve 2 karakterden fazla olmali',
                 do: () =>{
                     const password = _.get(kullanici,'password', '');

                     if(!password.length || password.length < 3 ){
                         return false;
                     }
                     return true;
                 }
             },

        };

        //butun gerekli bilgileri donguye alip kontrol ediyoruz gecerlimi degilmi diye
        kullanicibilgileri.forEach((kullanicibilgileri) =>{
            const kullanicibilgdogrulama = _.get(onayla , kullanicibilgileri);
            if(kullanicibilgdogrulama){

                const gecerliMi = kullanicibilgdogrulama.do();
                const msj = kullanicibilgdogrulama.HataMesaji;

                if(!gecerliMi){
                    hatalar.push(msj);
                }

            }



        });
        
        if (hatalar.length){
            const err = _.join(hatalar , ',');
            return callback(err , null);
        }

        // zaten varmi

        const isim = _.toLower(_.trim(_.get(kullanici , 'isim' , '')));
        this.app.db.collection('kullanicilar').findOne({isim: isim} , (err , result) =>{

            if(err || result){
                return callback({Message : "Isim zaten kayitli."} , null);
            }
            const password = _.get(kullanici , 'password');

            const FormatlanmisKullanici ={

              isim: `${_.trim(_.get(kullanici,'isim'))}`,
                //email: email,
                password: password,
                tarih : new Date(),



            };

            return callback(null , FormatlanmisKullanici);

            //console.log("kontrol " , err , result);
            
        });

        //return callback(null , kullanici);


}

    Yarat(kullanici){

        const db = this.app.db;

        console.log("Kullanici :" , kullanici);

        return new Promise((resolve , reject) =>{

            this.kaydetmedenOnce(kullanici ,(hata , kullanici) => {

                console.log("Onaylanma isleminden sonra :" , hata , kullanici);

                 if(hata){
                     return reject(hata);
                 }
                 //veritabanina yeni kullanici ekle fakat
                 db.collection('kullanicilar').insertOne(kullanici ,(hata , bilgi) =>{

                     // dogru ekliyor mu hata varmi
                     if(hata){
                         return reject({Mesaj : "Kayit sirasinda bir hata meydana geldi."});

                     }

                     const kullaniciId = _.get(kullanici , '_id').toString(); // userid string olsun OBJECT ID


                     this.kullanicilar = this.kullanicilar.set(kullaniciId , kullanici);

                        // hata yok
                     return resolve(kullanici);


                 });

            });
            //return reject("Kullanici bulunamadi !");


        });

    }

}