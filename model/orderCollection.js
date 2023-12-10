const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  productdetails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'collectionOfProduct', 
  }],
  paymentType: {
    type: String,
    required: true,
  },
  address: {
    street: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
  },
  totalPrice: {
    type: String,
    required :true,
  },
  orderStatus: {
    type: String,
    default: 'Pending',
  }

});


const orderCollection = mongoose.model('collectionOfOrder', orderSchema);

module.exports = orderCollection;
