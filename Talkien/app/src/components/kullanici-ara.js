import React, {Component} from 'react'
import _ from 'lodash'


export default class KullaniciAra extends Component {

    constructor(props) {
        super(props);

        this.KullaniciSec = this.KullaniciSec.bind(this);
    }

    KullaniciSec(kullanici) {

        console.log("Sectiginiz kullanici : ", kullanici);

        if (this.props.onSelect) {
            this.props.onSelect(kullanici);
        }

    }


    render() {

        const {depo} = this.props;

        const kullanicilar = depo.KullaniciAraAl();

        //console.log("search user " , search);

        return <div className="kullanici-ara">

            <div className="kullanici-listesi">


                {kullanicilar.map((kullanici, index) => {

                    return (<div onClick={() => this.KullaniciSec(kullanici)} key={index} className="kullanici">

                        <img src={_.get(kullanici, 'avatar')} alt="..."/>
                        <h2>{_.get(kullanici, 'isim')}</h2>
                    </div>)


                })}


            </div>

        </div>


    }


}