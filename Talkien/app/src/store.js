import {OrderedMap} from 'immutable'
import _ from 'lodash'
import Servis from "./servis"
import Realtime from "./realtime";

export default class Store {

    constructor(appComponent) {

        this.servis = new Servis();
        this.mesajlar = new OrderedMap();
        this.kanallar = new OrderedMap();


       this.kullanici=this.LocalDepodanKullaniciAl();
       this.kullanicilar = new OrderedMap();

        this.app = appComponent;

        this.token = this.LocalDepodanTokenAl();
        this.aktifKanal_ID = null;

        this.ara ={
            kullanicilar : new OrderedMap(),
        };

        this.realtime = new Realtime(this);

        this.kullaniciKanallariniYakala();

    }

    baglantiKes(){


        this.realtime.disconnect();

    }


    mesajAl() {                                                   // Mesaj return eder.GEREK YOK SIL

        return this.mesajlar.valueSeq();

    }

    avatarYukle(kullanici){

        return `https://api.adorable.io/avatars/100/${kullanici._id}.png`

    }

    OnBellegeKullaniciEkle(kullanici){
        kullanici.avatar = this.avatarYukle(kullanici);
        const id = _.toString(kullanici._id);
        this.kullanicilar = this.kullanicilar.set(id , kullanici);

        return kullanici;
        //this.yenile();
    }

    RealTimedanMesajlariGeriAl(mesaj , uyari = false){

        const id = _.toString(_.get(mesaj,'_id'));
        this.mesajlar = this.mesajlar.set(id , mesaj);

                const kanalId= _.toString(mesaj.kanalId);
                const kanal = this.kanallar.get(kanalId);

                //console.log("ARANAN" , kanalId);

                if(kanal){
                    kanal.uyari = uyari;
                    kanal.mesajlar = kanal.mesajlar.set(id , true);
                    kanal.sonMesaj = _.get(mesaj , 'body' , '');
                    this.kanallar = this.kanallar.set(kanalId , kanal);

                }else{

                    this.servis.get(`api/kanallar/${kanalId}`).then((response) =>{
                        const kanal = _.get(response , 'data');

                         // const kullanicilar = _.get(kanal , 'kullanicilar');
                         // _.each(kullanicilar,(kullanici) =>{
                         //
                         //    this.OnBellegeKullaniciEkle(kullanici);
                         //
                         // });

                        //this.kanallar = this.kanallar.set(kanalId , kanal);

                        this.realtime.realKanalEkle(kanal);

                    })

                }

        this.yenile();
    }

    OnbellegiTemizle(){

        this.kanallar = this.kanallar.clear();
        this.mesajlar = this.mesajlar.clear();
        this.kullanicilar = this.kullanicilar.clear();

    }

    cikisYap(){

        const kullaniciId = _.toString(_.get(this.kullanici, '_id', null));
        const tokenId = _.get(this.token, '_id', null); //this.token._id;
        // request to backend and loggout this user

        const secenekler = {
            headers: {
                authorization: tokenId,
            }
        };

        this.servis.get('api/ben/cikis', secenekler);

        this.kullanici = null;
        localStorage.removeItem('ben');
        localStorage.removeItem('token');

        this.OnbellegiTemizle();

        if (kullaniciId) {
            this.kullanicilar = this.kullanicilar.remove(kullaniciId);
        }

        this.yenile();




    }
    // cikisYap(){
    //     const kullaniciId = `${_.get(this.kullanici , '_id' , null)}`;
    //
    //     this.kullanici = null;
    //     localStorage.removeItem('ben');
    //     localStorage.removeItem('token');
    //
    //     this.OnbellegiTemizle();
    //
    //
    //     if(kullaniciId){
    //         this.kullanicilar = this.kullanicilar.remove(kullaniciId);
    //     }
    //
    //     this.yenile();
    //
    // }

    kullaniciKanallariniYakala(){

        const kullaniciToken = this.KullaniciTokenIDal();

        if(kullaniciToken){

            const secenekler={

              headers:{
                  authorization: kullaniciToken,
              }

            };

            this.servis.get(`api/ben/kanallar`,secenekler).then((response) => {


                const kanallar = response.data;

                _.each(kanallar , (c) =>{

                    this.realtime.realKanalEkle(c);
                });

                const ilkKanalID = _.get(kanallar ,'[0]._id' , null );

                this.kanalMesajiYakala(ilkKanalID);

            }).catch((err) =>{

                console.log('Kanallari fetch ederken bir hata olustu' , err);

                })
        }



    }

    tokenEkle(erisimTokeni){

        if(!erisimTokeni){
            this.localStorage.removeItem('token');
            this.token=null;

            return;
        }

        this.token = erisimTokeni;
        localStorage.setItem('token' , JSON.stringify(erisimTokeni));


    }

    LocalDepodanTokenAl(){

        if(this.token){ // local depodan kullanici al icin yazdim sacmalamis olabilirim
            return this.token;
        }

        let token = null;

        const veri = localStorage.getItem('token');
        if (veri){
            try {
                token = JSON.parse(veri);
            }

            catch (hata) {
                console.log("gene sacma bi yerde virgul unutmusundur")
            }

        }
        return token;
    }


    KullaniciTokenIDal(){

        const tokenId = _.get(this.token , '_id' , null );

        return tokenId;

    }


    KullaniciAramayaBasla(arama = ""){

        // serverda sorgu yap ve kullanici listesini al
        const veri = {arama: arama};

        this.ara.kullanicilar=this.ara.kullanicilar.clear();

        this.servis.post('api/kullanicilar/arama', veri).then((cevap) =>{

          //eslesen kayitlar
            const kullanicilar = _.get(cevap , 'data' , []);


            _.each(kullanicilar, (kullanici) =>{


                kullanici.avatar= this.avatarYukle(kullanici);
                const kullaniciId = `${kullanici._id}`;

                this.kullanicilar = this.kullanicilar.set(kullaniciId , kullanici);
                this.ara.kullanicilar = this.ara.kullanicilar.set(kullaniciId , kullanici);






            });

            this.yenile();

           // console.log("backendden kullanici listesini uzatirmisiniz" , kullanicilar);

        }).catch((hata) => {

            console.log("Kullanici bulunamadi !" , hata);
        })




    }


    LocalDepodanKullaniciAl(){

        let kullanici = null;
        const veri = localStorage.getItem('ben');

        //console.log("Lokal browser veri tabanindaki kullanici" , veri);

        try {


            kullanici = JSON.parse(veri);

        }
        catch (err){

            console.log("Hata");
        }

        if(kullanici){ //kullanici sayfayi yenilediginde backendle iletisime gec ve user var kabul et

            const token = this.LocalDepodanTokenAl();
            const tokenId = _.get(token , '_id');
            const options = {
                headers : {
                    authorization : tokenId,
                }
            };

            this.servis.get('api/kullanicilar/ben',options).then((cevap) => {

                const ErisimTokeni = cevap.data;
                const kullanici = _.get(ErisimTokeni , 'kullanici');
                this.YeniKullaniciEkle(kullanici);
                this.tokenEkle(ErisimTokeni);


            }).catch(hata =>{

                this.cikisYap();

            });


        }

        return kullanici;
    }

    YeniKullaniciEkle(kullanici){

        //gecici avatar databasede avatar yok moruk cildircam simdi

        kullanici.avatar = this.avatarYukle(kullanici);

    this.kullanici = kullanici;
    if(kullanici){
        localStorage.setItem('ben' , JSON.stringify(kullanici));

        //serverdan kayit olan kullaniciyi kaydet
        const kullaniciId = `${kullanici._id}`;
        this.kullanicilar = this.kullanicilar.set(kullaniciId , kullanici);
    }

    this.yenile();

    }

    GirisYap(isim=null,password=null){

        const Kullaniciisim = isim;

        //const _this = this;


        const kullanici = {
            isim: Kullaniciisim,
            password:password,

        };

        //console.log("Kullanici bilgileriyle login olma deneme1", kullanici);

        return new Promise((resolve , reject) => {

           //backeni cagirma zamani bebegim

            this.servis.post('api/kullanicilar/giris',kullanici).then((cevap) =>{

                const erisimTokeni = _.get(cevap , 'data');

                //console.log("Serverdan login basarili token :" ,erisimTokeni);

                const kullanici = _.get(erisimTokeni , 'kullanici');

                this.YeniKullaniciEkle(kullanici);

                this.tokenEkle(erisimTokeni);



                //realtime.js cagir soket servera kullaniciyla baglan

                this.realtime.connect();

                this.kullaniciKanallariniYakala();

            }).catch((hata) =>{

                console.log("Serverdan gelen bir login hatasi var" , hata);

                const mesaj = _.get(hata ,'cevap.data.error.mesaj' , "Login Hatasi");

                return reject(mesaj);
            })

        });

      /*  return new Promise((resolve , reject) => {

            const kullanici = kullanicilar.find((kullanici) => kullanici.email === kullaniciEmail);

            if (kullanici){
                _this.YeniKullaniciEkle(kullanici);

            }


            if(kullanici){
                return resolve(kullanici);

            }

            else {
                return reject("Kullanici Bulunamadi !");
            }


        });*/



    }

    kanalAl() {                                                   //Kanal return eder.


        this.kanallar = this.kanallar.sort((a, b) => a.guncellendi < b.guncellendi); // ekledikten sonra en uste gelmesi icin tarihe gore sirala

        return this.kanallar.valueSeq();

    }

    KullaniciAl() {
        return this.kullanici;
    }

    aktifKanalIDekle(id) {

        this.aktifKanal_ID = id;

        this.kanalMesajiYakala(id);

        this.yenile();


    }

    kanalMesajiYakala(kanalId){


        let kanal = this.kanallar.get(kanalId);
        if(kanal && !_.get(kanal , 'MesajlarYakalandiMi')){

            

            this.servis.get(`api/kanallar/${kanalId}/mesajlar`).then((cevap) =>{

                kanal.MesajlarYakalandiMi = true;

                const mesajlar = cevap.data;

                _.each(mesajlar,(mesaj) =>{

                    this.realtime.realMesajEkle(mesaj);
                });



                this.kanallar = this.kanallar.set(kanalId , kanal);

            }).catch((hata) => {

                console.log("Kanalin mesajlarini yakalarken bir sorun olustu" , hata);
            })




        }




    }
    kanaldanUyeSil(kanal =null , kullanici = null){


        if(!kanal || !kullanici){

            return;
        }

        const kullaniciId = _.get(kullanici , '_id');
        const kanalId = _.get(kanal , '_id');

        kanal.uyeler = kanal.uyeler.remove(kullaniciId);

        this.kanallar = this.kanallar.set(kanalId , kanal);

        this.yenile();


    }

    mesajEkle(id, mesaj = {}) {                              // Mesaj ekleme


        console.log("Hey dostum backende gondermem lazim bu lanet olasi mesaji" , mesaj);
        const kullanici = this.KullaniciAl(); // mesajin sahibi olmasi icin ekliyorum
        mesaj.kullanici = kullanici;

        this.mesajlar = this.mesajlar.set(id, mesaj); // anahtar ile uyusmadigi icin index stringe cast ettim --Hakan

        const kanalid = _.get(mesaj, 'kanalid');

        if (kanalid) {

            let kanal = this.kanallar.get(kanalid);


            kanal.sonMesaj = _.get(mesaj, 'body', '');

            // kanal bilgisini servera gonder

            const obje = {
                eylem : 'kanal_yarat',
                yuk : kanal,
            };
            this.realtime.yolla(obje);

            //console.log("Kanal : " , kanal);

            //web socketle servera yolla yeni mesaj olustur ve ilgilere haber ver pff :(

            this.realtime.yolla({

                    eylem : 'mesaj_yarat',
                    yuk : mesaj,


            });

            kanal.mesajlar = kanal.mesajlar.set(id, true);

            kanal.kanalYeniMi = false;
            this.kanallar = this.kanallar.set(kanalid, kanal);


        }


        this.yenile();

        //console.log(JSON.stringify(this.mesajlar.toJS())); //Yolladigim mesajin sahibi ben miyim debug !


    }

    kanalEkle(index, kanal = {}) {                                // Kanal ekleme
        this.kanallar = this.kanallar.set(`${index}`, kanal);  // tip uyusmazligi int string cast edildi

        this.yenile();
    }

    yenile() {

        this.app.forceUpdate();
    }

    KanalaKullaniciEkle(kanalid, kullaniciId) {

        //console.log("Kanala yeni kullanici ekliyorum ", kanalid, kullaniciId);

        const kanal = this.kanallar.get(kanalid);

        if (kanal) {

            kanal.uyeler = kanal.uyeler.set(kullaniciId, true);

            this.kanallar = this.kanallar.set(kanalid, kanal);
            this.yenile();

        }

    }


    KullaniciAraAl() {

        // console.log("sunu ariyorum " , search);

        //const keyword = _.toLower(ara);
        // const SuankiKullanici = this.KullaniciAl();
        // const SuankiKullaniciID = _.get(SuankiKullanici , '_id');
        // let Aranan = new OrderedMap();

        // if (_.trim(ara).length) {  // ararken kendimide arayamam kontrolude burda ifle yaptim tabvn videosundan bakarak
        //
        //     Aranan = kullanicilar.filter((kullanici) => _.get(kullanici , '_id') !== SuankiKullaniciID && _.includes(_.toLower(_.get(kullanici , 'isim')), keyword));
        //
        //     /*kullanicilar.filter((kullanici) => {
        //
        //         const isim = _.get(kullanici, 'isim');
        //         const kullaniciId = _.get(kullanici, '_id');
        //
        //         if (_.includes(isim, ara)) {
        //             Aranan = Aranan.set(kullaniciId, kullanici);
        //         }
        //
        //     })*/
        //
        //
        // }
        return this.ara.kullanicilar.valueSeq();

    }


    KanaldanMesajlariAl(kanal) {

        let mesajlar = new OrderedMap();

        if (kanal) {

            kanal.mesajlar.forEach((deger , anahtar) => {   // map kullaninca return deger ister o yuzden uyari verir

               const mesaj = this.mesajlar.get(anahtar);       // uyariyi susturmak icin bu sekle cevrildi.

               mesajlar = mesajlar.set(anahtar , mesaj);

            });

            // kanal.mesajlar.map((deger, anahtar) => {
            //
            //     const mesaj = this.mesajlar.get(anahtar);
            //
            //     mesajlar.push(mesaj);
            //
            // });

        }

        return mesajlar.valueSeq();
    }

    kayitOl(kullanici){

        return new Promise((resolve , reject) =>{


            this.servis.post('api/kullanicilar' , kullanici).then((cevap) =>{

                console.log("Kullanici olusturuldu." , cevap.data);

                return resolve(cevap.data);

            }).catch(hata =>{
                return reject("Bir hata olustu");
            })


        })


    }



    kanaldanUyeleriAl(kanal) {

        let uyeler = new OrderedMap();

        if (kanal) {

            kanal.uyeler.forEach((deger, anahtar) => {

                const kullaniciId =`${anahtar}`;

                const kullanici = this.kullanicilar.get(kullaniciId);

                const KayitliKullanici = this.KullaniciAl();

                if (_.get(KayitliKullanici, '_id') !== _.get(kullanici, '_id')) { // Kendi oldugum hesapla konusma yaratamam ve listede olamaz !
                    uyeler = uyeler.set(anahtar, kullanici);
                }


                /* kanal.uyeler.map((deger, anahtar) => {

                     // console.log("Debug Key" , anahtar);

                     const kullanici = kullanicilar.get(anahtar);

                     const KayitliKullanici = this.KullaniciAl();

                     if (_.get(KayitliKullanici, '_id') !== _.get(kullanici, '_id')) { // Kendi oldugum hesapla konusma yaratamam ve listede olamaz !
                         uyeler = uyeler.set(anahtar, kullanici);
                     }


                 }); */
            });

        }

        return uyeler.valueSeq();

    }

    aktifKanalAl() {

        const kanal = this.aktifKanal_ID ? this.kanallar.get(this.aktifKanal_ID) : this.kanallar.first();

        return kanal;
    }

    yeniKanalYarat(kanal = {}) {

        //console.log("Yeni kanal :" , kanal);
        const kanalId = _.get(kanal, '_id');
        this.kanalEkle(kanalId, kanal);

        this.aktifKanalIDekle(kanalId);

        //console.log(JSON.stringify(this.kanallar.toJS())); //kanal yaratirken kendimide ekledimi ona bakmak icin debug ettim

    }


}

// const kullanicilar = OrderedMap({
//     '1': {
//         _id: '1',
//         isim: "Hakan Özer",
//         kayittarihi: new Date(),
//         avatar: 'https://api.adorable.io/avatars/100/abott@hakan.png',
//         email: 'hakan@hotmail.com'
//     },
//     '2': {
//         _id: '2',
//         isim: "Dean Winchester",
//         kayittarihi: new Date(),
//         avatar: 'https://api.adorable.io/avatars/100/abott@Dean.png',
//         email:'dean@hotmail.com'
//     },
//     '3': {
//         _id: '3',
//         isim: "Bruce Wayne",
//         kayittarihi: new Date(),
//         avatar: 'https://api.adorable.io/avatars/100/abott@Batman.png',
//         email: 'bruce@hotmail.com'
//     },
//
//
// });