const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({

userId:{
  type: mongoose.Schema.Types.ObjectId,
  ref: "collectionOfUser", 
  required: true,
 },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "collectionOfProduct",
    required: true,
  },
  price: { 
    type: Number,
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  images: [{
    type: String,
  }],
});

 

const cartCollection = new  mongoose.model('collectionOfCart', cartSchema);

module.exports = cartCollection;
