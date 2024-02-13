const mongoose = require('mongoose');
// const userCollection = require('../model/userCollection');
// const productCollection =require('../model/productCollection');

const whishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'collectionOfUser',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'collectionOfProduct',
      required: true
    },
  }]
  
});

const whishlistCollection = mongoose.model('WhishlistCollection', whishlistSchema);
module.exports = whishlistCollection;
