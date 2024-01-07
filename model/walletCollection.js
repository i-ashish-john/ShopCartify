const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
   userId:{
    type:String,
    required:true
   } ,
   AddedAmount:{
    type:Number,
    required:true
   } ,
   time: {
      type: Date,
      default: Date.now,
    },

})

const walletCollection = new mongoose.model('collectionOfWallet',walletSchema);
module.exports = walletCollection;