const session = require('express-session');
const mongoose = require('mongoose');
const adminCollection = require('../model/adminCollection')
const userCollection = require('../model/userCollection');
const productCollection = require('../model/productCollection');
const CategoryCollection = require('../model/categoryCollection');
const orderCollection = require('../model/orderCollection');
const addressCollection = require('../model/addressCollection');
const returnCollection = require('../model/returnCollection');
const walletCollection = require('../model/walletCollection');
const couponCollection = require('../model/couponCollection');


const couponControllerFunction={

    couponPageLoad:async(req,res)=>{
        try{
            let couponDetails = await couponCollection.find();
            res.render('admin/couponList',{couponDetails});
        }catch(error){
            res.send(error);
        }
    },
    couponAdding:async(re,res)=>{
        try{
            // if(req.session.Admin){
            // }
            res.render('admin/couponAdd',{error:''});
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
                return res.render('admin/couponAdd', { error });
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
          const couponCode = req.params.code;
          let editedCoupon = await couponCollection.findOne({ couponCode: couponCode });
          res.render('admin/couponEdit', { editedCoupon: editedCoupon });
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    posteditCoupon:async(req,res)=>{
        try{
            console.log("Reached");

            const DatasToUpdate = { 
                couponCode: req.body.couponCode,
                expiryDate: req.body.expiryDate,
                productDiscount: req.body.productDiscount,
                minimumPurchaseValue: req.body.minimumPurchaseValue 
            }
            const updated = await couponCollection.findOneAndUpdate(DatasToUpdate);
            console.log("Updated or not",updated);
            res.redirect('/admin/couponmanage');

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
