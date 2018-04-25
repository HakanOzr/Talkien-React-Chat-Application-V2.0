import React, {Component} from 'react'
import _ from 'lodash'
import avatar from '../images/avatar.png'
import KullaniciFormu from './kullanici-form'
import KullaniciMenusu from  './kullanici-menu'


export default class KullaniciBar extends Component {


    constructor(props){
        super(props);

        this.state={

            KullaniciMenusunuGoster:false,
            KullaniciFormuGoster:false,
        }



    }

    render(){

        const {depo} = this.props;

        const ben = depo.KullaniciAl();



        const PP = _.get(ben , 'avatar');
        //console.log("me" , ben);

        return(

            <div className="kullanici-bar">

                {!ben ? <button onClick={()=> {

                    this.setState({
                        KullaniciFormuGoster:true,

                    })



                }} type="button" className="Giris-Butonu">Giris</button> : null}
                <div className="profil-adi">{_.get(ben , 'isim')}</div>
                 <div className="profil-resmi" onClick={()=> {

                        this.setState({
                            KullaniciMenusunuGoster:true,
                        })


                 }}><img src={PP ? PP : avatar} alt=""/></div>
                {!ben && this.state.KullaniciFormuGoster ? <KullaniciFormu onClose={() =>{

                    this.setState({
                        KullaniciFormuGoster:false,

                    });

                    console.log("kapatiliyor.");

                }} depo={depo}/> : null }

                {this.state.KullaniciMenusunuGoster ? <KullaniciMenusu

                    depo={depo}
                    onClose={() => {

                        this.setState({
                            KullaniciMenusunuGoster: false,

                        })


                    }}

                /> : null }

            </div>


        );

    }

}