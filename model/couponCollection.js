const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true,
    },
    expiryDate: {
        type: Date,
        required: true,
        get: (val) => val ? val.toISOString().split('T')[0] : val,
    },
    addedDate: {
        type: Date,
        default: Date.now,
        get: (val) => val ? val.toISOString().split('T')[0] : val,
    },
    productDiscount: {
        type: Number,
        required: true,
    },
    minimumPurchaseValue: {
        type: Number,
        required: true,
    },
});


const couponCollection = mongoose.model('collectionOfCoupon', couponSchema);
module.exports = couponCollection;
