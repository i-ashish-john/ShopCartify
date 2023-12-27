const express = require('express');
const router = express.Router();
router.use(express.urlencoded({ extended: true }))
const multer = require('multer')
const AdminSession = require('../middleware/admin/AdminSession');
const adminController = require('../controller/adminController');

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
router.post('/productmanagePost',AdminSession, upload.array('Images', 5), adminController.productmanagePost);
router.get('/productlist', AdminSession,adminController.productlist);
router.post('/deleteproduct/:id', AdminSession,adminController.productDelete);
router.post('/updateproduct/:id',AdminSession, upload.array('Images', 5), adminController.updateproduct);
router.get('/editproduct/:id',AdminSession, adminController.editproduct);

router.get('/categoryadd', AdminSession,adminController.categoryadd);
router.post('/categoryadd',AdminSession, adminController.categoryaddPost)
router.get('/categorymanage',AdminSession, adminController.categorymanage);
router.post('/categoryManagementdelete/:id',AdminSession, adminController.categorydelete);
router.post('/categoryeditpage/:id',AdminSession, adminController.categoryeditpage);
router.post('/categoryManagementedit/:id',AdminSession, adminController.categoryedit);
router.get('/orders',AdminSession,adminController.orders);
router.post('/ordersPost/:id',AdminSession,adminController.ordersPost);




module.exports = router;