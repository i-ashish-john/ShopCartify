const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
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
router.get('/cartload', session, userController.cartload)
router.get('/addToCart', userController.addToCart);
router.post('/removeitems/:id', userController.cartItemRemove);
// router.post('/updateCartItem/:productId/decrease',userController.updateCartItem);
// router.post('/updateCartItem/:productId/increase',userController.updateCartItem);
router.post('/updateQuantity/:productId/:action',userController. updateCartItem);
// router.get("/singleproduct/:id",userController.getSingleProduct);
//increase cart quatity
router.get('/increaseq/:id',userController.incCart)
router.get('/decreaseq/:id',userController.decCart);

router.get('/checkout',userController.checkout);
router.post('/checkoutpost',userController.checkoutPost);
router.post('/submitAddress',userController.submitAddress);
// router.post('/ordersuccess-xyz',userController.orderSuccess);
// router.get('/userprofile',userController.userProfile);//this route to rendering the userprofile
router.get('/orderstatus',userController.orderStatus);
router.post('/Userdetails',userController.UserDetails)
router.get('/profile',userController.profile)//this is for updating the user profile values
router.get('/addAddressUser',userController.addAddressUserPage);
router.post('/NewAddressAddedForUser',userController.NewAddressAddedForUser);
router.get('/addCheckoutAddress',userController.addCheckoutAddress);
router.post('/addCheckoutAddress',userController.addCheckoutAddress);


module.exports = router;











