import React,{Component} from 'react'
import _ from 'lodash'
import classNames from 'classnames'


export default class KullaniciFormu extends Component{




    constructor(props){
     super(props);


    this.state = {
        mesaj:null,
        loginMi:true,
        kullanici: {
            isim: '',
            password:''
        }
    };

            this.formuYolla = this.formuYolla.bind(this);
            this.TextAlaniDegisti = this.TextAlaniDegisti.bind(this)
            this.disaritikla = this.disaritikla.bind(this);

        }

    disaritikla(event){

    if(this.ref && !this.ref.contains(event.target)){

        console.log("disari tikladin");

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
    formuYolla(event){
        const {kullanici , loginMi} = this.state;
        const {depo} = this.props;

        event.preventDefault();

        this.setState({
            mesaj:null,

        },() => {


            //console.log("Form is submitted " , kullanici)

                    if(loginMi){

                        depo.GirisYap(kullanici.isim, kullanici.password).then((kullanici) => {

                            console.log("callback : ", kullanici);

                            if(this.props.onClose){
                                this.props.onClose();
                            }

                            // this.setState({
                            //     mesaj:null,
                            // });

                        }).catch((hata) => {

                            console.log("Hata :", hata);
                            this.setState({
                                mesaj: {
                                    body: hata,
                                    type: 'Hata',
                                }
                            })

                        });
                    }else{
                        depo.kayitOl(kullanici).then((_)=>{

                            this.setState({
                                mesaj: {
                                    body: 'Kullanici olusturma islemi basarili!',
                                    type: 'success'
                                }

                            }, () =>{       // hesap yarattiktan sonra direk login olmaya gonderiyorum

                                depo.GirisYap(kullanici.isim , kullanici.password).then(()=>{

                                    if(this.props.onClose){
                                        this.props.onClose();
                                    }



                                });


                            })

                        })
                    }
        })

    }

    TextAlaniDegisti(event){

        let {kullanici} = this.state;

        const alan = event.target.name;

        kullanici[alan] = event.target.value;

        this.setState({

           kullanici: kullanici

        });

        //console.log("Text is change" , event.target.name , event.target.value);




    }



render(){

        const {kullanici , mesaj ,loginMi} = this.state;

    return(




        <div className="kullanici-formu" ref={(ref) => this.ref = ref}>


            <form onSubmit={this.formuYolla} method="post">
                {mesaj ? <p className={classNames('app-message' , _.get(mesaj , 'type'))}>{_.get(mesaj ,'body')}</p> : null }



                <div className="form-nesnesi">

                    <label>Isim</label>
                    <input placeholder={'Isminiz'} onChange={this.TextAlaniDegisti} type={'text'} value={_.get(kullanici, 'isim', '' )} name={"isim"}/>

                </div>



                 <div className="form-nesnesi">
                    <label>Parola</label>
                    <input value={_.get(kullanici , 'password')} onChange={this.TextAlaniDegisti} type="password" placeholder="Parola" name="password"/>
                </div>

                <div className="form-eylemleri">
                    {loginMi ? <button onClick={() =>{

                        this.setState({
                            loginMi: false,
                        })


                    }} type="button">Hesap yaratin</button> : null}

                    <button className="birincil" type="submit">{loginMi ? 'Giris Yap' : 'Yeni hesap yarat'}</button>
                </div>
            </form>

        </div>




    );








    }


}