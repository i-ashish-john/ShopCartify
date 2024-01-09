// const mongoose = require('mongoose');

// const walletSchema = new mongoose.Schema({
//    userId:{
//     type:String,
//     required:true
//    } ,
//    AddedAmount:{
//     type:Number,
//     required:true
//    } ,
//    time: {
//       type: Date,
//       default: Date.now,
//     },

// })

// const walletCollection = new mongoose.model('collectionOfWallet',walletSchema);
// module.exports = walletCollection;

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
   
  },
  amounts: {
    type: [Number],
    required: true
  },
  time: {
    type: Date,
    default: Date.now,
  },
 
});

walletSchema.virtual('totalAmount').get(function () {
  return this.amounts.reduce((acc, amount) => acc + amount, 0);
});

const walletCollection = mongoose.model('collectionOfWallet', walletSchema);
module.exports = walletCollection;
