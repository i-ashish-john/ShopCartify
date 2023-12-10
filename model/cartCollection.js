const mongoose = require('mongoose');
const productCollection = require('../model/productCollection');
const lodash = require('lodash');


const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'collectionOfUser',
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'collectionOfProduct',
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      images: [
        {
          type: String,
        },
      ],
      individualTotal: {
        type: String,
      },
    },
  ],
  total: {
    type: Number,
    default: 0,
  },
});


cartSchema.methods.calculateTotal = lodash.debounce(async function () {
  // Check if already calculating total to avoid parallel save
  if (this.calculatingTotal) {
    return;
  }

  // Set the flag to true to indicate that calculation is in progress
  this.calculatingTotal = true;

  try {
    let total = 0;
    for (const product of this.products) {
      const productDetails = await productCollection.findById(product.productId);
      const productPrice = productDetails.price;
      total += product.price * productPrice * product.quantity;
    }

    this.total = total;
    await this.save();
  } finally {
    // Reset the flag after the calculation and save are completed
    this.calculatingTotal = false;
  }

}, 1000); 

const cartCollection = mongoose.model('collectionOfCart', cartSchema);

module.exports = cartCollection;
