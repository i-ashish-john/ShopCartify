const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
   customersId:{
    type:String,
    required:true
   } ,
   AddedAmount:{
    type:Number,
    required:true
   } ,
   normalAmount:{
    type:Number,
    required:true
   }
})

const walletCollection = mongoose.model('collectionOfWallet',walletSchema);
module.exports = walletCollection