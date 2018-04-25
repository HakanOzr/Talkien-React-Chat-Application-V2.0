import Kullanici from './kullanici'
import Token from './token'
import Connection from './connection'
import Kanal from "./kanal";
import Mesaj from './mesaj'

export default class Model{

    constructor(app){

        this.app= app;

        this.kullanici=new Kullanici(app);
        this.token = new Token(app);
        this.connection = new Connection(app);
        this.kanal = new Kanal(app);
        this.mesaj = new Mesaj(app);

    }

}