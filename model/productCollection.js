const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// Define the product schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  Discount: {
    type: Number,
    min: 0,
    max: 100, 
    default: 0, 
  },
  Images: [String],

  deleted: {
    type: Boolean,
    default: false,
  },

});


const ProductCollection = new mongoose.model('collectionOfProduct', productSchema);

module.exports = ProductCollection;
