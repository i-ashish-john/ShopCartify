const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({

    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"collectionOfProduct",
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    // userId:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:"collectionOfUser",
    //     required:true
    // },
    orderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"collectionOforder",
        required:true
    },
    amount:{
      type:Number,
      required:true
    },
    status:{
        type:String,
        required:true

    }

});
const returnCollection = mongoose.model('collectionOfReturn',returnSchema);

module.exports = returnCollection;
