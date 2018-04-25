import {MongoClient} from 'mongodb'

const URL = 'mongodb://localhost:27017/talkien';

export default class Database{

    constructor(){

    }



    baglan(){

        return new Promise((resolve , reject ) =>{

            MongoClient.connect(URL,(hata , db) =>{

                if(hata){
                    return reject(hata);
                }

                return resolve(db);

            });

        });


    }




}