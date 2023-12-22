const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController');
const forgotpassController = require('../controller/forgotpassController');
const session = require('../middleware/userAuth');
const blockedAuth = require('../middleware/userBlockedAuth');

router.get('/home', userController.home);
router.get('/', userController.login)
router.post('/login', userController.loginpost)
router.get('/signout', userController.signout)
router.get('/signup', userController.signup)
router.post('/signup', userController.signupPost)
// router.get('/home',userController.home);


// router.get('/OTP',userController.otpGet)
router.post('/OTP', userController.sendOTPByEmail)
router.get('/productdetails', session, blockedAuth, userController.productdetails);
router.get('/backToHome', session, blockedAuth, userController.back);

router.get('/Totallistpro', blockedAuth, session, userController.MensTotalproductlist);
router.get('/WomensTotallistpro', session, blockedAuth, userController.WomensTotalproductlist);

router.get('/checkout', session, blockedAuth, userController.checkout);
router.post('/Userdetails', session, blockedAuth, userController.UserDetails)
router.get('/profile', session, blockedAuth, userController.profile)//this is for updating the user profile values
router.get('/addAddressUser', session, blockedAuth, userController.addAddressUserPage);
router.post('/NewAddressAddedForUser', session, blockedAuth, userController.NewAddressAddedForUser);

router.get('/cartload', session, blockedAuth, cartController.cartload)
router.get('/addToCart', session, blockedAuth, cartController.addToCart);
router.post('/removeitems/:id', session, blockedAuth, cartController.cartItemRemove);
router.post('/updateQuantity/:productId/:action', session, blockedAuth, cartController.updateCartItem);
router.get('/increaseq/:id', session, blockedAuth, cartController.incCart)
router.get('/decreaseq/:id', session, blockedAuth, cartController.decCart);

router.post('/checkoutpost', session, blockedAuth, orderController.checkoutPost);
router.post('/submitAddress', session, blockedAuth, orderController.submitAddress);
router.get('/orderstatus', session, blockedAuth, orderController.orderStatus);
router.get('/addCheckoutAddress', session, blockedAuth, orderController.addCheckoutAddress);
router.post('/addCheckoutAddress', session, blockedAuth, orderController.addCheckoutAddress);
router.get('/ListOfOrders', session, blockedAuth, orderController.orderList);
router.post('/SingleOrderlist/:id', session, blockedAuth, orderController.SingleOrderlist);
router.post('/cancelOrders/:id', session, blockedAuth, orderController.cancelOrder);

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


module.exports = router;











