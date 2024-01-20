const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController');
const forgotpassController = require('../controller/forgotpassController');
const returnController = require('../controller/returnController');

const Usersession = require('../middleware/user/userAuth');
const blockedAuth = require('../middleware/user/userBlockedAuth');


router.get('/home', userController.home);
router.get('/', userController.login)
router.post('/login', userController.loginpost)
router.get('/signout', userController.signout)
router.get('/signup', userController.signup)
router.post('/signup', userController.signupPost)
// router.get('/home',userController.home);


// router.get('/OTP',userController.otpGet)
router.post('/OTP', userController.sendOTPByEmail)
router.get('/productdetails', Usersession, blockedAuth, userController.productdetails);
router.get('/backToHome', Usersession, blockedAuth, userController.back);

router.get('/Totallistpro', blockedAuth, Usersession, userController.MensTotalproductlist);
router.get('/WomensTotallistpro', Usersession, blockedAuth, userController.WomensTotalproductlist);

router.get('/checkout', Usersession, blockedAuth, userController.checkout);
router.post('/Userdetails', Usersession, blockedAuth, userController.UserDetails)
router.get('/profile', Usersession, blockedAuth, userController.profile)//this is for updating the user profile values
router.get('/addAddressUser', Usersession, blockedAuth, userController.addAddressUserPage);
router.post('/NewAddressAddedForUser', Usersession, blockedAuth, userController.NewAddressAddedForUser);

router.get('/cartload', Usersession, blockedAuth, cartController.cartload)
router.get('/addToCart', Usersession, blockedAuth, cartController.addToCart);
router.post('/removeitems/:id', Usersession, blockedAuth, cartController.cartItemRemove);
router.post('/updateQuantity/:productId/:action', Usersession, blockedAuth, cartController.updateCartItem);
router.get('/increaseq/:id', Usersession, blockedAuth, cartController.incCart)
router.get('/decreaseq/:id', Usersession, blockedAuth, cartController.decCart);

router.post('/checkoutpost', Usersession, blockedAuth, orderController.checkoutPost);
router.post('/submitAddress', Usersession, blockedAuth, orderController.submitAddress);
router.get('/orderstatus', Usersession, blockedAuth, orderController.orderStatus);
router.get('/addCheckoutAddress', Usersession, blockedAuth, orderController.addCheckoutAddress);
router.post('/addCheckoutAddress', Usersession, blockedAuth, orderController.addCheckoutAddress);
router.get('/ListOfOrders', Usersession, blockedAuth, orderController.orderList);
router.post('/SingleOrderlist/:id', Usersession, blockedAuth, orderController.SingleOrderlist);
router.post('/cancelOrders/:id', Usersession, blockedAuth, orderController.cancelOrder);
router.post('/RetrunProduct/:id',Usersession,blockedAuth,orderController.ReturnTotalProduct);
router.get('/walletLoad',Usersession,blockedAuth,orderController.walletLoad);
router.post('/walletPay',Usersession,blockedAuth,orderController.walletPay);

router.post('/couponChecking',Usersession,blockedAuth,orderController.couponChecking);



// router.post('/updateCartItem/:productId/decrease',userController.updateCartItem);
// router.post('/updateCartItem/:productId/increase',userController.updateCartItem);
// router.get("/singleproduct/:id",userController.getSingleProduct);
//increase cart quatity
// router.post('/ordersuccess-xyz',userController.orderSuccess);
// router.get('/userprofile',userController.userProfile);//this route to rendering the userprofile

router.get('/forgot-password', forgotpassController.forgotPasswordLoadPage);
router.post('/forgot-passwordPost', forgotpassController.forgotPasswordLoadpagePost);
router.post('/verifyOtp', forgotpassController.verifyOtp);
router.post('/update-password', forgotpassController.updatePassword);
// router.get('/resendOTP', forgotpassController.resend);

router.post('/payPost',Usersession, blockedAuth, orderController.payPost)


module.exports = router;











