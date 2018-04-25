const WebSocket = require('uws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {

console.log("Istemci 2 sunucuya basarili bir sekilde baglandi !");

ws.send('Merhaba sunucu benim adim client 2 !');


//dinle

ws.on('message' , (message) => {

console.log(message);

});



});