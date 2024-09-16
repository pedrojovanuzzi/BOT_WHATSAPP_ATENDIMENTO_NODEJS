"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function middlewareGlobal(req,res,next){
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');
    res.locals.login = req.session.login;
    next();
} exports.middlewareGlobal = middlewareGlobal;

 function loginRequired(req,res,next){
    if(!req.session.login){
        req.flash('errors', 'Faça login para poder acessar');
        return res.redirect('/');
    }
    next();
} exports.loginRequired = loginRequired;

 function Error502(req,res,next){
    if (res.status === 502) {
        return res.redirect('/login');
    }
    next();
} exports.Error502 = Error502;