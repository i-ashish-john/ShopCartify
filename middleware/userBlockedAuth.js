// const blockedAuth = (req, res, next) => {
//     try {
//         const isBlocked = req.session.isBlocked;

//         if (isBlocked) {
//             // If the user is blocked, redirect to the signout page
//             const redirectTo = '/signout';
//             res.redirect(redirectTo);
//         } else {
//             // If the user is not blocked, proceed to the next middleware
//             next();
//         }
//     } catch (error) {
//         next(error);
//     }
// };

// module.exports = blockedAuth;
const userCollection = require("../model/userCollection");

const blockedAuth = async (req, res, next) => {
    try {
        const email = req.session.user;
    console.log("the session of the user is :", email);
    const user = await userCollection.findOne({ email: email });
    console.log("the logged user is :", user);

    if (user && user.isblocked === false) {
        next();
    } else {
        res.render('user/userlogin');
    }
        
    } catch (error) {
        console.log(error);
    }
    
};
module.exports = blockedAuth;

