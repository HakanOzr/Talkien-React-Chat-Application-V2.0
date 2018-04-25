import _ from 'lodash';
import {OrderedMap} from 'immutable'


export default class Realtime{


    constructor(depo){

        this.depo = depo ;
        this.ws = null ;
        this.baglandiMi = false;

        this.connect();



    }


    mesajiDecode(msj){

        let mesaj ={};

        try {
            mesaj = JSON.parse(msj);

        }
        catch (hata) {
            console.log(hata)
        }

        return mesaj;

    }
    mesajOku(msj){

        const depo = this.depo;

        const simdikiKullanici=depo.KullaniciAl();
        const simdikiKullaniciId=_.toString(_.get(simdikiKullanici , '_id'));

    const mesaj = this.mesajiDecode(msj);

    const eylem = _.get(mesaj , 'eylem' , '');

    const yuk = _.get(mesaj , 'yuk');

    switch (eylem){

        case 'mesaj_eklendi':

            const AktifKanal = depo.aktifKanalAl();
            let uyari =_.get(AktifKanal , '_id') !==_.get(yuk, 'kanalId') && simdikiKullaniciId !== _.get(yuk , 'kullaniciId');
          this.realMesajEkle(yuk , uyari);

            break;

        case'kanal_eklendi':

            this.realKanalEkle(yuk);

            break;


        case 'kullanici_online':

            const onlineMi = true;

            this.KullaniciDurumunuGuncelle(yuk , onlineMi );

            break;

        case 'kullanici_offline':

            this.KullaniciDurumunuGuncelle(yuk , false);



            break;

        default:
            break;


    }



    }

    realMesajEkle(yuk , uyari = false){

        const depo = this.depo;
        let kullanici = _.get(yuk , 'kullanici');


        //kullaniciyi onbellege ekleyelim
        kullanici = depo.OnBellegeKullaniciEkle(kullanici);

        const simdikiKullanici=depo.KullaniciAl();
        const simdikiKullaniciId=_.toString(_.get(simdikiKullanici , '_id'));

        const mesajObjesi={

            _id : yuk._id,
            body : _.get(yuk , 'body' , ''),
            kullaniciId : _.get(yuk , 'kullaniciId'),
            kanalId:_.toString(_.get(yuk , 'kanalId')),
            tarih : _.get(yuk , 'tarih' , new Date()),
            ben : simdikiKullaniciId === _.toString(_.get(yuk , 'kullaniciId')),
            kullanici : kullanici,

        };

        //let uyari = true;
        depo.RealTimedanMesajlariGeriAl(mesajObjesi , uyari);

    }

    realKanalEkle(yuk){

        const depo = this.depo;

        const kullanicilar =_.get(yuk , 'kullanicilar' , []);
        const kanalId = _.toString(_.get(yuk, '_id'));
        const kullaniciId = `${yuk.kullaniciID}`;
        //yuku kontrol et ve depoya yeni kanal ekle

        let kanal = {
            ad: _.get(yuk, 'ad'),
            KullaniciID: kullaniciId,        //    `${_.get(yuk.KullaniciID)}`,
            uyeler: new OrderedMap(),
            mesajlar: new OrderedMap(),
            tarih: new Date(),
            _id: kanalId,
            sonMesaj: _.get(yuk, 'sonMesaj'),
            kanalYeniMi: false,

        };
        _.each(kullanicilar,(kullanici) =>{

            const uyeId= `${kullanici._id}`;

            this.depo.OnBellegeKullaniciEkle(kullanici);

            kanal.uyeler = kanal.uyeler.set(uyeId , true);

        });

        const kanalMesajlari = depo.mesajlar.filter((x) => _.toString(x.kanalId)=== kanalId);

        kanalMesajlari.forEach((msj)=>{
            const msgId = _.toString(_.get(msj, '_id'));
            kanal.mesajlar = kanal.mesajlar.set(msgId, true);
        });

        depo.kanalEkle( kanalId , kanal);

    }

    KullaniciDurumunuGuncelle(kullaniciId , onlineMi = false){

        const depo=this.depo;

        depo.kullanicilar = depo.kullanicilar.update(kullaniciId , (kullanici)=>{

            if(kullanici){
                kullanici.online = onlineMi;

            }


            return kullanici;


        });

        depo.yenile();

        // const kullanici = depo.kullanicilar.get(kullaniciId);
        //
        // if(kullanici){
        //
        //
        // kullanici.online = onlineMi;
        //
        // this.kullanicilar = this.kullanicilar.set(kullaniciId , kullanici);
        //
        // }
    }

    yetkilendirme(){

        const depo = this.depo;

        const tokenId = depo.KullaniciTokenIDal();


        if(tokenId){
            const mesaj = {
                eylem : 'yetki',
                yuk : `${tokenId}`,


            };

            this.yolla(mesaj);


        }




    }


    connect(){
        //console.log("Baglanmaya basla websocketle.");

        this.ws = new WebSocket('ws://localhost:3001');

        this.ws.onopen = () => {
            console.log("Baglandiniz");

            this.baglandiMi= true;

            //servera kendini tanit bebek
            this.yetkilendirme();


            this.ws.onmessage = (event) =>{

                this.mesajOku(_.get(event , 'data'));

                console.log("Serverdan mesaj var :" , event.data);
            }







        };

        this.ws.onclose = () =>{
            console.log("Baglanti sonlandirildi.");
            this.baglandiMi = false;
        };

        this.ws.onerror = () =>{

            this.baglandiMi = false;
            this.depo.yenile();
        }


    }

    disconnect(){

        this.ws.close();
        console.log("Baglanti Kesildi.");

    }


    yolla(msj ={}){

        const baglandiMi = this.baglandiMi;
        if(this.ws && baglandiMi){
            const msjString = JSON.stringify(msj);
            this.ws.send(msjString);
        }

    }

}