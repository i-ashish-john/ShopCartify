const mongoose = require('mongoose');
const productCollection = require('../model/productCollection');
const userCollection = require('../model/userCollection');
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
      discount_price:{
        type: Number,
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

// cartSchema.methods.calculateTotal = lodash.debounce(async function () {
//   if (this.calculatingTotal) {
//     return;
//   }
//   this.calculatingTotal = true;
//   try {
//     let total = 0;

//     for (const product of this.products) {
//       const productDetails = await productCollection.findById(product.productId);
//       let productPrice = productDetails.price;

//       if (productDetails.Discount > 0) {
//         const discount = productDetails.Discount / 100;
//         productPrice -= productPrice * discount;

//         product.individualTotal = (product.quantity * productPrice).toFixed(2);
//       }

//       total += productPrice * product.quantity;
//     }

//     this.total = total;
//     await this.save();
//   } finally {
//     this.calculatingTotal = false;
//   }

// }, 1000);
// const cartCollection = mongoose.model('collectionOfCart', cartSchema);

// module.exports = cartCollection;
////////////////////////////------////????//////////
// cartSchema.methods.calculateTotal = async function () {
//   let total = 0;

//   for (const product of this.products) {
//     const productDetails = await productCollection.findById(product.productId);

//     if (productDetails) {  // Check if productDetails is not null or undefined
//       let productPrice = productDetails.price;

//       if (productDetails.Discount > 0) {  // Adjust property name for discount
//         const Discount = productDetails.Discount / 100;
//         productPrice -= productPrice * Discount;
//       }

//       total += productPrice * product.quantity;
//     }
//   }

//   this.total = total;
//   await this.save();
// };

// const cartCollection = mongoose.model('collectionOfCart', cartSchema);

// module.exports = cartCollection;
//////////////
//new
cartSchema.methods.calculateTotal = lodash.debounce(async function () {
  if (this.calculatingTotal) {
    return;
  }
  this.calculatingTotal = true;
  try {
    let total = 0;

    for (const product of this.products) {
      const productDetails = await productCollection.findById(product.productId);
console.log(productDetails+"hey");
      if (productDetails) {
        let productPrice = productDetails.price;

        if (productDetails.Discount) {
          const discount = productDetails.Discount / 100;
          productPrice -= productPrice * discount;

          product.individualTotal = (product.quantity * productPrice).toFixed(2);
        }

        total += productPrice * product.quantity;
      }
    }

    this.total = total;
    await this.save();
  } finally {
    this.calculatingTotal = false;
  }
}, 1000);

const cartCollection = mongoose.model('collectionOfCart', cartSchema);

module.exports = cartCollection;