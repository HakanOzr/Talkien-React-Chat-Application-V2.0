'use strict';

var WebSocket = require('uws');

var ws = new WebSocket('ws://localhost:3001');

ws.on('open', function () {

  console.log("Istemci 1 sunucuya basarili bir sekilde baglandi !");

  ws.send('Merhaba sunucu benim adim client 1 !');

  //Dinleme islemi sunucuyu dinle

  ws.on('message', function (message) {

    console.log(message);
  });
});
//# sourceMappingURL=client1.js.map