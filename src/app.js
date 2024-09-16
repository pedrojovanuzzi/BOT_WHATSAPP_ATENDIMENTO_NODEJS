import express from 'express';
import path from 'path';
import homeRoutes from './routes/home.routes.js';
import menuRotes from './routes/menu.routes.js';
import pixRoutes from './routes/pix.routes.js';
import whatsRoutes from './routes/whats.routes.js';
import session from 'express-session';
import flash from 'connect-flash';
import { middlewareGlobal, Error502 } from './middlewares/Middlewares.js';
// import AddClient from "./controllers/AddClientDBController.js";

const sessionOptions = session({
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
        this.app = express();
        this.setup();
        this.middlewares();
        this.routes();
    }
    setup(){
        this.app.set('views', path.resolve(__dirname, 'views'));
        this.app.set('view engine', 'ejs');
        this.app.use(express.static(path.resolve(__dirname, 'public')));
    }

    routes(){
        this.app.use('/', homeRoutes);
        this.app.use('/menu', menuRotes);
        this.app.use('/pix', pixRoutes);
        this.app.use('/whats', whatsRoutes);
    }

    middlewares(){
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.json());
        this.app.use(sessionOptions);
        this.app.use(flash());
        this.app.use(middlewareGlobal);
        this.app.use(Error502);
    }
}

export default new App().app;
