'use strict';

var WebSocket = require('uws');

var ws = new WebSocket('ws://localhost:3001');

ws.on('open', function () {

  console.log("Istemci 2 sunucuya basarili bir sekilde baglandi !");

  ws.send('Merhaba sunucu benim adim client 2 !');

  //dinle

  ws.on('message', function (message) {

    console.log(message);
  });
});
//# sourceMappingURL=client2.js.map