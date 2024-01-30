const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(express.urlencoded({ extended: true }))
const multer = require('multer')
const AdminSession = require('../middleware/admin/AdminSession');
const adminController = require('../controller/adminController');
const couponController = require('../controller/couponController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

// const { constants } = require('buffer');
router.get('/dashboardForAdmin', adminController.dashboardForAdmin);
router.get('/dashboard', adminController.dashboard);
router.get('/login', adminController.adminlogin);
router.post('/login', adminController.postlogin);

router.post('/create',AdminSession, adminController.createPost);
router.post('/block/:id',AdminSession, adminController.blockid);
router.post('/unblock/:id',AdminSession, adminController.unblockid);
router.get('/logout',AdminSession, adminController.logout);
router.get('/usermanage', AdminSession,adminController.usermanage);
router.get('/productmanage', AdminSession,adminController.productmanage);
// router.post('/productmanagePost',AdminSession, upload.array('Images', 5), adminController.productmanagePost);
router.post('/productmanagePost',AdminSession, upload.array('Images',5), adminController.productmanagePost);

router.get('/productlist', AdminSession,adminController.productlist);

router.post('/deleteproduct/:id', AdminSession,adminController.productDelete);
router.get('/editproduct/:id',AdminSession, adminController.editproduct);

router.post('/updateproduct/:id',AdminSession, upload.array('Images', 5), adminController.updateproduct);

router.get('/categoryadd', AdminSession,adminController.categoryadd);
router.post('/categoryadd',AdminSession, adminController.categoryaddPost)
router.get('/categorymanage',AdminSession, adminController.categorymanage);
router.post('/categoryManagementdelete/:id',AdminSession, adminController.categorydelete);
router.post('/categoryeditpage/:id',AdminSession, adminController.categoryeditpage);
router.post('/categoryManagementedit/:id',AdminSession, adminController.categoryedit);
router.get('/orders',AdminSession,adminController.orders);
//herer
router.post('/ordersPost/:id',AdminSession,adminController.ordersPost);//this is the code

router.get('/couponmanage',AdminSession,couponController.couponPageLoad);
router.get('/couponAddingGet',AdminSession,couponController.couponAdding);
router.post('/couponmanagePost',AdminSession,couponController.couponAddingPost);
router.get('/couponEdit/:code',AdminSession,couponController.geteditCoupon);
router.post('/couponEditBackPost', AdminSession, couponController.posteditCoupon);

router.get('/couponDelete/:code',AdminSession,couponController.getDeleteCoupon)

//chart js route
router.get('/getMonthlyData',AdminSession,adminController.getMonthlyData);
router.get('/getYearlyData',AdminSession,adminController.getYearlyData);

router.get('/exportOrdersToExcel',AdminSession,adminController.excelDownload)

router.get('/returnOrderManage',adminController.returnManage);
router.post('/returnApproved/:id',adminController.Approved);
router.post('/returnDenyed/:id',adminController.Denyed);


module.exports = router;