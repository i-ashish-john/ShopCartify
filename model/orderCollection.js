const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  orderId: {
    type: String,
    required: true,
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adressCollection',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userCollection',
    required: true,
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'productCollection',
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Net Banking', 'Wallet'],
    required: true,
  }
});

const orderCollection = mongoose.model('collectionOfOrder', orderSchema);

module.exports = orderCollection;
