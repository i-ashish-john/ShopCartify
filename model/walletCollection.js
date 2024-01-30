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
////////////////////////////////////////
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
 userId: {
    type: String,
    required: true,
 },
 amounts: {
    type: [Number],
    default: [],
 },
 creditAmounts: {
    type: [Number],
    required: true,
 },
 debitAmounts: {
    type: [Number],
    required: true,
 },
 time: {
    type: Date,
    default: Date.now,
 },
});

walletSchema.pre('save', function (next) {
   if (this.isModified('creditAmounts')) {
        let totalCreditAmount = this.creditAmounts.reduce((a, b) => a + b, 0);
        this.amounts = [totalCreditAmount];
   }
   next();
});

const walletCollection = mongoose.model('collectionOfWallet', walletSchema);

module.exports = walletCollection;
//////////////////////////////////
// const mongoose = require('mongoose');

// const walletSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//   },
//   amounts: {
//     type: [Number],
//     default: [],
//   },
//   creditAmounts: {
//     type: [Number],
//     required: true,
//   },
//   debitAmounts: {
//     type: [Number],
//     required: true,
//   },
//   time: {
//     type: Date,
//     default: Date.now,
//   },
// });

// walletSchema.pre('save', function (next) {
//   if (this.isModified('creditAmounts')) {
//     const totalCreditAmount = this.creditAmounts.reduce((a, b) => {
//       const numB = parseFloat(b); // Convert each value to a number
//       return isNaN(numB) ? a : a + numB; // Only add valid numbers
//     }, 0);

//     this.amounts = [totalCreditAmount];
//   }
//   next();
// });

// const walletCollection = mongoose.model('collectionOfWallet', walletSchema);

// module.exports = walletCollection;
