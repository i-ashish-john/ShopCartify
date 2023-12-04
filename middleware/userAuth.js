const session = (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            res.redirect('/');
        }
    } catch (error) {
        next(error);
    }
};

module.exports=session;
