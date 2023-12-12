const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController');
const session = require('../middleware/userAuth');

router.get('/home', userController.home);
router.get('/', userController.login)
router.post('/login', userController.loginpost)
router.get('/signout', session, userController.signout)
router.get('/signup', userController.signup)
router.post('/signup', userController.signupPost)
// router.get('/home',userController.home);

// router.get('/OTP',userController.otpGet)
router.post('/OTP', userController.sendOTPByEmail)
router.get('/productdetails',userController.productdetails);
router.get('/backToHome', userController.back);
router.get('/Totallistpro', userController.Totalproductlist);
router.get('/checkout',userController.checkout);
router.post('/Userdetails',userController.UserDetails)
router.get('/profile',userController.profile)//this is for updating the user profile values
router.get('/addAddressUser',userController.addAddressUserPage);
router.post('/NewAddressAddedForUser',userController.NewAddressAddedForUser);

router.get('/cartload', session, cartController.cartload)
router.get('/addToCart', cartController.addToCart);
router.post('/removeitems/:id', cartController.cartItemRemove);
router.post('/updateQuantity/:productId/:action',cartController. updateCartItem);
router.get('/increaseq/:id',cartController.incCart)
router.get('/decreaseq/:id',cartController.decCart);

router.post('/checkoutpost',orderController.checkoutPost);
router.post('/submitAddress',orderController.submitAddress);
router.get('/orderstatus',orderController.orderStatus);
router.get('/addCheckoutAddress',orderController.addCheckoutAddress);
router.post('/addCheckoutAddress',orderController.addCheckoutAddress);
router.get('/ListOfOrders',orderController.orderList);
// router.post('/updateCartItem/:productId/decrease',userController.updateCartItem);
// router.post('/updateCartItem/:productId/increase',userController.updateCartItem);
// router.get("/singleproduct/:id",userController.getSingleProduct);
//increase cart quatity
// router.post('/ordersuccess-xyz',userController.orderSuccess);
// router.get('/userprofile',userController.userProfile);//this route to rendering the userprofile




module.exports = router;











