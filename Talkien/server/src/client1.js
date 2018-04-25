const WebSocket = require('uws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {

console.log("Istemci 1 sunucuya basarili bir sekilde baglandi !");

ws.send('Merhaba sunucu benim adim client 1 !');

//Dinleme islemi sunucuyu dinle

ws.on('message' , (message) => {

console.log(message);

});



});