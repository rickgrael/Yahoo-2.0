function authentication(req, res, next){
    const user = req.session.user;
    if(user != null){
        return next()
    }
    else{
        return res.redirect('/login');
    }
}

module.exports = authentication;