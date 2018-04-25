'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _uws = require('uws');

var _uws2 = _interopRequireDefault(_uws);

var _appRouter = require('./app-router');

var _appRouter2 = _interopRequireDefault(_appRouter);

var _models = require('./models');

var _models2 = _interopRequireDefault(_models);

var _database = require('./database');

var _database2 = _interopRequireDefault(_database);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PORT = 3001;
var app = (0, _express2.default)();
app.server = _http2.default.createServer(app);

//app.use(morgan('dev'));


app.use((0, _cors2.default)({
    exposedHeaders: "*"
}));

app.use(_bodyParser2.default.json({
    limit: '50mb'
}));

app.wss = new _uws.Server({

    server: app.server

});

new _database2.default().baglan().then(function (db) {

    console.log("Database baglantisi basarili !");

    app.db = db;
}).catch(function (hata) {

    throw hata;
});

app.models = new _models2.default(app);
app.routers = new _appRouter2.default(app);

app.server.listen(process.env.PORT || PORT, function () {
    console.log('Uygulaman\u0131n \xE7al\u0131\u015Ft\u0131\u011F\u0131 port numaras\u0131 ' + app.server.address().port);
});

exports.default = app;
//# sourceMappingURL=index.js.map