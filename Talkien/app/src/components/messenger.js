import React, {Component} from 'react'
import classNames from 'classnames'
//import avatar from '../images/avatar.png'
import {OrderedMap} from 'immutable'
import {ObjectID} from '../helpers/objectid'
import _ from 'lodash'
import KullaniciBar from './kullanici-bar'
import moment from 'moment'
import KullaniciAra from './kullanici-ara'



export default class Messenger extends Component {

    constructor(props) {
        super(props);


        this.state = {

            height: window.innerHeight,
            yenimsjdeneme: '', // Input yerindeki default placeholder mesajim
            kullaniciAra: "",
            aramaBariGoster: false



        };


        this.boyutAyari = this.boyutAyari.bind(this);
        this.KanalaAvatarAyarlaMORUK=this.KanalaAvatarAyarlaMORUK.bind(this);
        this.inputYolla = this.inputYolla.bind(this);
        this.KanalYarat = this.KanalYarat.bind(this);
        this.KanalAdiDegistir = this.KanalAdiDegistir.bind(this);
        this.disconnect = this.disconnect.bind(this);

    }



    disconnect(){ // sunu depoya depodanda realtimea yollicam olmazsa api ile gondercem kodu yollamadan kontrol et - HAKAN
        const {depo} = this.props;

        depo.baglantiKes();

    }



    KanalYarat(){

        const {depo} = this.props;

        const kanalid = new ObjectID().toString();
        const SuankiKullanici = depo.KullaniciAl();
        const SuankiKullaniciID =_.get(SuankiKullanici , '_id');

        const kanal = {

            ad: '' ,
            KullaniciID:SuankiKullaniciID,
            uyeler: new OrderedMap(),
            mesajlar: new OrderedMap(),
            tarih: new Date(),
            _id: kanalid,
            sonMesaj: "",
            kanalYeniMi: true,

        };

        kanal.uyeler = kanal.uyeler.set(SuankiKullaniciID , true);

        depo.yeniKanalYarat(kanal);

//console.log('Yeni kanal yaratiyom');


    }

    KanalAdiDegistir(kanal = null) {


        if(!kanal){
            return null;
        }

        const {depo} = this.props;
        const uyeler = depo.kanaldanUyeleriAl(kanal);
        //const SuankiKullanici = depo.KullaniciAl();
        //const SuankiKullaniciID =_.get(SuankiKullanici , '_id');


        const isimler = [];

        uyeler.forEach((kullanici) => {

            const isim = _.get(kullanici, 'isim');

            isimler.push(isim);
        });

        let ad = _.join(isimler, ',');

        if(!ad && _.get(kanal , 'kanalYeniMi')){
            ad = 'Yeni Sohbet';

        }

        //console.log(isimler);

        return <h2>{ad}</h2>
    }


    inputYolla() {   // Girdigimiz inputu yollamak icin yazilmis bir fonksiyon youtubedaki videodan esinlenildi
        const {yenimsjdeneme} = this.state; // yenimsjdenemeyi tanimla
        const {depo} = this.props; // depoyu tanimla


        if (_.trim(yenimsjdeneme).length) {

            const kanal = depo.aktifKanalAl();
            const Kullanici = depo.KullaniciAl();
            const kanalid = _.get(kanal, '_id', null);
            const MesajinIDsi = new ObjectID().toString(); // objectid kullanilarak mesaj id atandi

            // console.log("Gondere tiklandi" , yenimsjdeneme);


            const mesaj = {
                kanalid: kanalid,
                id: MesajinIDsi,
                KullaniciID :_.get(Kullanici , '_id' , null),
                body: yenimsjdeneme, // mesajin icerigi test mesajlarindan geliyor
                //gonderen: _.get(Kullanici, 'isim', null),
                // avatar: avatar,
                ben: true, // yollayan benim


            };

            // console.log("Yeni mesaj objesi : " , mesaj);
            depo.mesajEkle(MesajinIDsi, mesaj); // depodan alinan mesaj ekle ile kullandim

            this.setState({
                yenimsjdeneme: '',
            })


        }


    }

    KanalaAvatarAyarlaMORUK(kanal){


    const depo = this.props.depo;
    const max = 4 ;

    const uyeler = depo.kanaldanUyeleriAl(kanal);

    const total = uyeler.size > max ? max : uyeler.size;

       const avatarlar = uyeler.map((kullanici , index) =>{

           return index < max ? <img key={index} src={_.get(kullanici , 'avatar')}  alt={_.get(kullanici , 'isim')}/> :null


        });

        return <div className={classNames('kanal-avatarlari', `kanal-avatarlari-${total}`)}>{avatarlar}</div>

    }


    boyutAyari() {

        this.setState({

            height: window.innerHeight

        });

    }


    // testMesajlari() {
    //
    //     //let {mesajlar} = this.state;  eski tanim gerek yok store ekledik
    //
    //     const {depo} = this.props;
    //
    //
    //     for (let i = 0; i < 100; i++) {
    //
    //         let GonderenBenMiyim = false;
    //
    //         if (i % 3 === 0) {
    //             GonderenBenMiyim = true
    //         }
    //
    //         const yeniMesaj = {
    //             avatar: avatar,
    //             ben: GonderenBenMiyim,
    //             _id: `${i}`,
    //             gonderen: `Gonderen  ${i}`,
    //             body: `Mesaj icerigi ${i}`,
    //
    //         }
    //
    //
    //         depo.mesajEkle(i, yeniMesaj); // verdigim indexe yeni mesajin icerigini ekle
    //         //mesajlar.push(yeniMesaj); //prototipti tasarimi gormek icindi kaldirdim mesaj ekleyip tasarimda baktim - HAKAN
    //
    //         // this.forceUpdate(); artik storedan cagiriyoruz gerek kalmadi
    //     }
    //
    //
    //     for (let j = 0; j < 5; j++) {
    //
    //
    //         let yeniKanal = {
    //             ad: `Kanal Ismi ${j}`,
    //             uyeler: new OrderedMap({
    //                 '1': true,
    //                 '3': true,
    //                 '2': true,
    //             }),
    //             mesajlar: new OrderedMap(),
    //             tarih: new Date(),
    //             _id: `${j}`,
    //             sonMesaj: `Gorusuruz.${j}`,
    //
    //         };
    //
    //         const mesajID = `${j}`;
    //         const FazlaMesajID = `${j + 1}`;
    //
    //
    //         yeniKanal.mesajlar = yeniKanal.mesajlar.set(mesajID, true);
    //         yeniKanal.mesajlar = yeniKanal.mesajlar.set(FazlaMesajID, true);
    //
    //         depo.kanalEkle(j, yeniKanal);
    //
    //     }
    //
    //     // this.setState({mesajlar:mesajlar}); // ekranda goster state ata gerek yok artik
    //
    // }


    render() {

        const {depo} = this.props;

        const {height} = this.state;

        const style = {
            height: height,
        };

        const aktifKanal = depo.aktifKanalAl();

        const mesajlar = depo.KanaldanMesajlariAl(aktifKanal);
        /* LODASH KULLANDIM - HAKAN*/

        const kanallar = depo.kanalAl();
        const uyeler = depo.kanaldanUyeleriAl(aktifKanal);




        //console.log("Aktif kanal  : " , aktifKanal);

        return <div style={style} className="app-messenger">

            <div className="header">

                <div className="sol">
                    <button onClick={this.disconnect} className="sol-eylem"><i className="icon-cogs"/></button>
                    <button onClick={this.KanalYarat} className="sag-eylem"><i className="icon-commenting"/></button>

                </div>
                <div className="content">
                    {_.get(aktifKanal, 'kanalYeniMi') ? <div className="toolbar">
                        <label>Ara : </label>{

                        uyeler.map((kullanici , anahtar) => {

                            return <span onClick={() => {
                                console.log("bu kullaniciyi konusmadan silmek istiyorum" , kullanici);


                                depo.kanaldanUyeSil(aktifKanal , kullanici);

                            }} key={anahtar}>{_.get(kullanici , 'isim')}</span>
                        })

                    }
                        <input placeholder=" Kimi Ariyorsun?" onChange={(olay) => {

                            const kullaniciArayazisi = _.get(olay, 'target.value');

                            //console.log("ismiyle kullanici ara :" , kullaniciArayazisi)

                            this.setState({
                                kullaniciAra: kullaniciArayazisi,
                                aramaBariGoster: true

                            },() => {



                                depo.KullaniciAramayaBasla(kullaniciArayazisi);
                            });


                        }} type="text" value={this.state.kullaniciAra}/>


                        {this.state.aramaBariGoster ? <KullaniciAra
                            onSelect={(kullanici) => {


                                //console.log("Tiklayarak sectiginiz eleman : " , kullanici.isim);

                                this.setState({
                                    aramaBariGoster: false,
                                    kullaniciAra: '',
                                }, () => {

                                    const kanalid = _.get(aktifKanal, '_id');
                                    const kullaniciId = _.get(kullanici, '_id');

                                    depo.KanalaKullaniciEkle(kanalid, kullaniciId);


                                });

                            }}

                                         depo={depo}/> : null}


                    </div> : this.KanalAdiDegistir(aktifKanal)}


                </div>
                <div className="sag">



                    <KullaniciBar depo ={depo} />
                    {/*<div className="kullanici-bar">*/}
                        {/*<div className="profil-adi">Hakan</div>*/}

                        {/*<div className="profil-resmi"><img src={avatar} alt=""/></div>*/}

                    {/*</div>*/}

                </div>

            </div>
            <div className="main">
                <div className="sidebar-sol">

                    {uyeler.size > 0 ? <div><h2 className="baslik">Üyeler</h2>
                        <div className="uyeler">


                            {uyeler.map((uye, key) => {


                                const onlineMi = _.get(uye,'online' , false);
                                return (

                                    <div key={key} className="uye">
                                        <div className="kullanici-resmi">
                                            <img src={_.get(uye, 'avatar')} alt=""/>
                                            <span className={classNames('kullanici-durumu', {'online' : onlineMi})} />
                                        </div>

                                        <div className="uye-bilgi">
                                            <h2>{uye.isim} - <span className={classNames('kullanici-durumu' , {'online' : onlineMi})}>{onlineMi ? 'Online' : 'Offline'}</span></h2>
                                            <p>{moment(uye.tarih).fromNow()} </p>

                                        </div>

                                    </div>

                                )

                            })}


                        </div>
                    </div> : null}


                </div>
                <div className="content">
                    <div className="mesajlar">

                        {mesajlar.map((mesaj, index) => {

                            const kullanici = _.get(mesaj , 'kullanici');

                            return (

                                <div key={index} className={classNames('mesaj', {'ben': mesaj.ben})}>
                                    <div className="mesaj-kullanici-resmi">
                                        <img src={_.get(kullanici , 'avatar')} alt=""/>
                                    </div>
                                    <div className="body-mesaj">

                                        <div className="mesaji-gonderen">{mesaj.ben ? 'Sen' : _.get(mesaj , 'kullanici.isim')}</div>
                                        <div className="mesaj-text">
                                            <p>
                                                {mesaj.body}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            )


                        })}


                    </div>

                    {aktifKanal && uyeler.size > 0 ? <div className="mesaj-giris">

                        <div className="yazi-giris">
                            <textarea onChange={(event) => {


                                this.setState({yenimsjdeneme: _.get(event, 'target.value')});


                            }} value={this.state.yenimsjdeneme} placeholder="Ne söylemek istersin?"/>
                        </div>
                        <div className="eylemler">
                            <button onClick={this.inputYolla} className="yolla">Gönder</button>
                        </div>
                    </div> : null}

                </div>
                <div className="sidebar-sag">

                    <div className="kanallar">

                        {kanallar.map((kanal, key) => {
                            return (

                                <div onClick={(key) => {

                                    depo.aktifKanalIDekle(kanal._id);

                                }} key={kanal._id}
                                     className={classNames('kanal',{'uyari': _.get(kanal,'uyari') === true},{'aktif': _.get(aktifKanal, '_id') === _.get(kanal, '_id', null)})}>

                                    <div className="kullanici-resmi">
                                        {this.KanalaAvatarAyarlaMORUK(kanal)}
                                    </div>

                                    <div className="kanal-bilgisi">

                                            {this.KanalAdiDegistir(kanal)}

                                        <p>{
                                            kanal.sonMesaj
                                        }</p>
                                    </div>
                                </div>
                            )

                        })}

                    </div>


                </div>

            </div>
        </div>

    }

    componentDidMount() {

        window.addEventListener('resize', this.boyutAyari);
        //this.testMesajlari();

    }

    componentWillUnmount() {

        window.removeEventListener('resize', this.boyutAyari)
    }
}