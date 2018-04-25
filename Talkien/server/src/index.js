import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import WebSocketServer, {Server} from 'uws';
import AppRouter from "./app-router"
import Model from "./models"
import Database from "./database"


const PORT = 3001;
const app = express();
app.server = http.createServer(app);


//app.use(morgan('dev'));


app.use(cors({
    exposedHeaders: "*"
}));

app.use(bodyParser.json({
    limit: '50mb'
}));

app.wss = new Server({

    server: app.server

});





new Database().baglan().then((db) => {

    console.log("Database baglantisi basarili !");

    app.db = db;

}).catch((hata) => {

    throw(hata);

});


app.models = new Model(app);
app.routers = new AppRouter(app);








app.server.listen(process.env.PORT || PORT, () => {
        console.log(`Uygulamanın çalıştığı port numarası ${app.server.address().port}`);
});

export default app;