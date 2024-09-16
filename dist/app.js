"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express'); var _express2 = _interopRequireDefault(_express);
var _path = require('path'); var _path2 = _interopRequireDefault(_path);
var _homeroutesjs = require('./routes/home.routes.js'); var _homeroutesjs2 = _interopRequireDefault(_homeroutesjs);
var _menuroutesjs = require('./routes/menu.routes.js'); var _menuroutesjs2 = _interopRequireDefault(_menuroutesjs);
var _pixroutesjs = require('./routes/pix.routes.js'); var _pixroutesjs2 = _interopRequireDefault(_pixroutesjs);
var _whatsroutesjs = require('./routes/whats.routes.js'); var _whatsroutesjs2 = _interopRequireDefault(_whatsroutesjs);
var _expresssession = require('express-session'); var _expresssession2 = _interopRequireDefault(_expresssession);
var _connectflash = require('connect-flash'); var _connectflash2 = _interopRequireDefault(_connectflash);
var _Middlewaresjs = require('./middlewares/Middlewares.js');
// import AddClient from "./controllers/AddClientDBController.js";

const sessionOptions = _expresssession2.default.call(void 0, {
    secret: 'akasdfj0út23453456+54qt23qv  qwf qwer qwer qewr asdasdasda a6()',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true
    }
  });
  

class App{
    constructor(){
        this.app = _express2.default.call(void 0, );
        this.setup();
        this.middlewares();
        this.routes();
    }
    setup(){
        this.app.set('views', _path2.default.resolve(__dirname, 'views'));
        this.app.set('view engine', 'ejs');
        this.app.use(_express2.default.static(_path2.default.resolve(__dirname, 'public')));
    }

    routes(){
        this.app.use('/', _homeroutesjs2.default);
        this.app.use('/menu', _menuroutesjs2.default);
        this.app.use('/pix', _pixroutesjs2.default);
        this.app.use('/whats', _whatsroutesjs2.default);
    }

    middlewares(){
        this.app.use(_express2.default.urlencoded({extended: true}));
        this.app.use(_express2.default.json());
        this.app.use(sessionOptions);
        this.app.use(_connectflash2.default.call(void 0, ));
        this.app.use(_Middlewaresjs.middlewareGlobal);
        this.app.use(_Middlewaresjs.Error502);
    }
}

exports. default = new App().app;
