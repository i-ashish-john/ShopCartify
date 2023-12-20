// const session = (req, res, next) => {
//     try {
//         if (req.session.user) {
//             next();
//         } else {
        
//             res.render('user/userlogin');
//         }
//     } catch (error) {
//         next(error);
//     }
// };

// module.exports = session;
const session = (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            res.render('user/userlogin');
        }
    } catch (error) {
        next(error);
    }
};

module.exports =  session;