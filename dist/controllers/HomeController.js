"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Userjs = require('../models/User.js'); var _Userjs2 = _interopRequireDefault(_Userjs);


class HomeController{
    async index(req,res){
        res.render('home');
    }

    async login(req,res){
        const {login, senha} = req.body;

        const user = await _Userjs2.default.findOne({where: {login: login}});

        if(!user){
            req.flash('errors', 'Usuario não encontrado');
            req.session.save(() => {
                res.redirect('back');
            })
        }
        else{
            const userPassword = _Userjs2.default.findOne({where: {senha: senha}});
            if(!userPassword){
                req.flash('errors', 'Senha Invalida');
                req.session.save(() => {
                    res.redirect('back');
                })
            }
            else{
                req.session.login = login;

                req.session.save(() => {
                    res.render('menu');
                })
            }
        }
    }

}

exports. default = new HomeController();