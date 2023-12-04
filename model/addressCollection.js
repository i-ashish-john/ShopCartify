const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({


    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "collectionOfUser",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "collectionOfProduct",
        required: true
    },
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "collectionOfCart",
        required: true
    },
    street: {   
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    }
});

const addressCollection = mongoose.model('collectionOfAddress', addressSchema);

module.exports = addressCollection;