const session = require('express-session');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const adminCollection = require('../../model/adminCollection')
const userCollection = require('../../model/userCollection');
const productCollection = require('../../model/productCollection');
const CategoryCollection = require('../../model/categoryCollection');
const orderCollection = require('../../model/orderCollection');
const addressCollection = require('../../model/addressCollection');
const returnCollection = require('../../model/returnCollection');
const walletCollection = require('../../model/walletCollection');
const couponCollection = require('../../model/couponCollection');



const couponControllerFunction={

    couponPageLoad:async(req,res)=>{
        try{
            const page = parseInt(req.query.page) || 1; 
            const limit = 3; 
            const skip = (page - 1) * limit;
    
            let couponDetails = await couponCollection.find().skip(skip).limit(limit);
    
            const totalCoupons = await couponCollection.countDocuments();
    
            const totalPages = Math.ceil(totalCoupons / limit);
    
            res.render('admin/couponList', { couponDetails, totalPages, currentPage: page });
        }catch(error){
            res.send(error);
        }
    },
    couponAdding:async(re,res)=>{
        try{
            // if(req.session.Admin){
            // }
            res.render('admin/couponAdd',{error:'',discounterror:'',message:'',minimumPurchaseValueError:''});
        }catch(error){
            res.send(error.message);
        }

    },
    couponAddingPost: async (req, res) => {
        try {
            console.log("ENTERED IN TO THE ADDING COUPON PAGE GET");
            const existingCoupon = await couponCollection.findOne({ couponCode: req.body.couponCode });

            if (existingCoupon) {
                const error = "Coupon is already added. Please try a different code.";
                return res.render('admin/couponAdd', { error ,discounterror:'',message:'',minimumPurchaseValueError:''});
            }
            if(req.body.productDiscount > 100){
                 const discounterror = "coupon discount cannot be greater than 100";
                 return res.render('admin/couponAdd', { discounterror ,error:'',message:'',minimumPurchaseValueError:''});
            }
            if(req.body.productDiscount < 1){
                const discounterror  ="Coupon discount cannot be less than 1";
                return res.render('admin/couponAdd', { error:'' ,discounterror,message:'',minimumPurchaseValueError:''});
            }
           // Assuming you are checking the purchase value itself
                const minimumPurchaseValue = req.body.minimumPurchaseValue;

                if (minimumPurchaseValue < 1) {
                const minimumPurchaseValueError = "Purchase limit cannot be negative values";
                return res.render('admin/couponAdd', { error: '', discounterror: '', message: '', minimumPurchaseValueError });
                }

            const today = new Date();
            const expiryDate = new Date(req.body.expiryDate);
            
            // Check if expiry date is today or in the past
            if (expiryDate <= today) {
                const message ="Expiry date must be a future date";
                return res.render('admin/couponAdd',{ error:'' ,discounterror:'',message,minimumPurchaseValueError:''})
            }
            let newCoupon = new couponCollection({
                couponCode: req.body.couponCode,
                expiryDate: req.body.expiryDate,
                productDiscount: req.body.productDiscount,
                minimumPurchaseValue: req.body.minimumPurchaseValue
            });
        console.log("the new coupon is here ",newCoupon);
            await newCoupon.save();
            res.redirect('/admin/couponmanage');
        } catch (error) {
            res.status(500).send(error);
        }
     },
     geteditCoupon: async(req,res) => {
        try {
            console.log("reached the getEditCoupon@@!!");
          const couponCode = req.params.code;//here getting the coupon code not objectId;
          req.session.coupon = couponCode;
          console.log("* the session couponCode",req.session.coupon);
          let editedCoupon = await couponCollection.findOne({ couponCode: couponCode });
          console.log("the edittedCoupon",editedCoupon);
          res.render('admin/couponEdit', { editedCoupon: editedCoupon , message:'',errorMessage:''});
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    posteditCoupon:async(req,res)=>{//here
      try{
          console.log("Reached");
          const DatasToUpdate = { 
              couponCode: req.body.couponCode,
              expiryDate: req.body.expiryDate,
              productDiscount: req.body.productDiscount,
              minimumPurchaseValue: req.body.minimumPurchaseValue 
          }
          const existingCoupon = await couponCollection.findOne({couponCode:DatasToUpdate.couponCode});
          if (
              DatasToUpdate.couponCode.trim() === '' ||
              DatasToUpdate.expiryDate.trim() === '' ||
              DatasToUpdate.productDiscount.trim() === '' ||
              DatasToUpdate.minimumPurchaseValue.trim() === ''
          ) {
              let editedCoupon = await couponCollection.findOne({ couponCode: req.session.coupon });
             
              res.render('admin/couponEdit', { errorMessage: 'Please enter values in all the fields' ,editedCoupon:editedCoupon,message:''});
              return; 
          }
          if(DatasToUpdate.couponCode == existingCoupon){
              let editedCoupon = await couponCollection.findOne({ couponCode: req.session.coupon });

              res.render('admin/couponEdit', { errorMessage: 'This coupon name is already used' ,editedCoupon:editedCoupon,message:''});
          }
          if(DatasToUpdate.productDiscount > 100){
              let editedCoupon = await couponCollection.findOne({ couponCode: req.session.coupon });

              res.render('admin/couponEdit', { errorMessage: 'cannot be greater than 100' ,editedCoupon:editedCoupon,message:''});
          }
          if(DatasToUpdate.productDiscount < 1){
              let editedCoupon = await couponCollection.findOne({ couponCode: req.session.coupon });

              res.render('admin/couponEdit', { errorMessage: 'cannot be less than 1' ,editedCoupon:editedCoupon,message:''});
          }
          if (DatasToUpdate.minimumPurchaseValue < 1) {
              let editedCoupon = await couponCollection.findOne({ couponCode: req.session.coupon });

              console.log("enter or wot??");
              res.render('admin/couponEdit', { errorMessage: 'minimum purchase cannot be less than 1' ,editedCoupon:editedCoupon,message:''});
          }
          const today = new Date();
          const expiryDate = new Date(existingCoupon.expiryDate);
          
          // Check if expiry date is today or in the past
          if (expiryDate <= today) {
              let editedCoupon = await couponCollection.findOne({ couponCode: req.session.coupon });
              res.render('admin/couponEdit', { errorMessage: 'Expiry date must be a future date ' ,editedCoupon:editedCoupon,message:''});
          }
          const updated = await couponCollection.findOneAndUpdate(DatasToUpdate);
          console.log("Updated or not",updated);
          // res.redirect('/admin/couponmanage');
          // let couponDetails = await couponCollection.find();
          const page = parseInt(req.query.page) || 1; 
          const limit = 3; 
          const skip = (page - 1) * limit;
  
          let couponDetails = await couponCollection.find().skip(skip).limit(limit);
  
          const totalCoupons = await couponCollection.countDocuments();
  
          const totalPages = Math.ceil(totalCoupons / limit);
          res.render('admin/couponList',{couponDetails, totalPages, currentPage: page});
      }catch(error){
        console.error(error);
      }
  },
    

    getDeleteCoupon:async(req,res)=>{
        try{
        const couponCode = req.params.code;
        console.log("#CODE",couponCode);
        const DeleteList = await couponCollection.findOne({ couponCode: couponCode });
        const updated = await couponCollection.findOneAndDelete(DeleteList);
        res.redirect('/admin/couponmanage');    
        }catch(error){
            console.error('Error:', error);

        } 
    }
};


module.exports = couponControllerFunction;
