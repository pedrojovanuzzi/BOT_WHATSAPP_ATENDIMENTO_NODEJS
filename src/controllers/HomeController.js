import User from '../models/User.js';


class HomeController{
    async index(req,res){
        res.render('home');
    }

    async login(req,res){
        const {login, senha} = req.body;

        const user = await User.findOne({where: {login: login}});

        if(!user){
            req.flash('errors', 'Usuario não encontrado');
            req.session.save(() => {
                res.redirect('back');
            })
        }
        else{
            const userPassword = User.findOne({where: {senha: senha}});
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

export default new HomeController();