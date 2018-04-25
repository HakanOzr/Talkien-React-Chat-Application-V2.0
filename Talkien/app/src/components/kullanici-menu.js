import React,{Component} from 'react'



export default class KullaniciMenusu extends Component{




    constructor(props) {
        super(props);

        this.disaritikla = this.disaritikla.bind(this);


    }

    disaritikla(event){

        if(this.ref && !this.ref.contains(event.target)){

            //console.log("disari tikladin");

            if(this.props.onClose){
                this.props.onClose();
            }
        }


    }


    componentDidMount(){

        window.addEventListener('mousedown' , this.disaritikla);

    }

    componentWillUnmount(){

        window.removeEventListener('mousedown' , this.disaritikla);


    }


    render(){

        const {depo} = this.props;

        const kullanici = depo.KullaniciAl();

        return <div className="kullanici-menusu" ref={(ref) => this.ref = ref}>
            <h2>Benim Menüm</h2>
            <ul className="menu">
                {kullanici ? <li><button onClick={() => {
                    if(this.props.onClose){

                        this.props.onClose();
                    }

                    depo.cikisYap();


                }} type="button">Çıkıs Yap</button></li> :null}


            </ul>

        </div>


    }



}