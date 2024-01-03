const mongoose = require('mongoose');
const uuid = require('uuid');
const moment =  require('moment')

const orderSchema = new mongoose.Schema({

  orderId: {
    type: String,
    default: () => {
      const randomNumbers = Math.floor(1000 + Math.random() * 9000); // here iam generating random number
      const randomAlphabets = Math.random().toString(36).substring(2, 4).toUpperCase(); // generating here. 1 or 2 random alphabets
      return `ODR-${randomNumbers}${randomAlphabets}`;
    },
    unique: true,
    required: true,
  },
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
  },
  orderDate: {
    type: Date,
    default: Date.now,
    set: function(value) {
      return moment(value).format('YYYY-MM-DD');
    },
  }

});

orderSchema.pre('find', function (next) {
  this.populate('productdetails');
  next();
});


const orderCollection = mongoose.model('collectionOfOrder', orderSchema);

module.exports = orderCollection;
