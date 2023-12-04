const express = require('express');
const router = express.Router();
router.use(express.urlencoded({ extended: true }))
const multer = require('multer')
const adminController = require('../controller/adminController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
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
// router.get('/create',adminController.create);
router.post('/create', adminController.createPost);
router.post('/block/:id', adminController.blockid);
router.post('/unblock/:id', adminController.unblockid);
router.get('/logout', adminController.logout);
router.get('/usermanage', adminController.usermanage);
router.get('/productmanage', adminController.productmanage);
router.post('/productmanagePost', upload.array('Images', 5), adminController.productmanagePost);
router.get('/productlist', adminController.productlist);
router.post('/deleteproduct/:id', adminController.productDelete);
router.post('/updateproduct/:id', adminController.updateproduct);
router.get('/editproduct/:id', adminController.editproduct);

router.get('/categoryadd', adminController.categoryadd);
router.post('/categoryadd', adminController.categoryaddPost)
router.get('/categorymanage', adminController.categorymanage);
router.post('/categoryManagementdelete/:id', adminController.categorydelete);
router.post('/categoryeditpage/:id', adminController.categoryeditpage);
router.post('/categoryManagementedit/:id', adminController.categoryedit);
router.post('/orders',adminController.orders)



module.exports = router;