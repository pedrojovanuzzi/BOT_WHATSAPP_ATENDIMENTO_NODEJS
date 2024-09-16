export function middlewareGlobal(req,res,next){
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');
    res.locals.login = req.session.login;
    next();
}

export function loginRequired(req,res,next){
    if(!req.session.login){
        req.flash('errors', 'Faça login para poder acessar');
        return res.redirect('/');
    }
    next();
}

export function Error502(req,res,next){
    if (res.status === 502) {
        return res.redirect('/login');
    }
    next();
}