// const mongoose = require('mongoose');
// const cron = require('node-cron');

// const couponSchema = new mongoose.Schema({
//     couponCode: {
//         type: String,
//         required: true,
//     },
//     expiryDate: {
//         type: Date,
//         required: true,
//         get: (val) => val ? val.toISOString().split('T')[0] : val,
//     },
//     addedDate: {
//         type: Date,
//         default: Date.now,
//         get: (val) => val ? val.toISOString().split('T')[0] : val,
//     },
//     productDiscount: {
//         type: Number,
//         required: true,
//     },
//     minimumPurchaseValue: {
//         type: Number,
//         required: true,
//     },
// });


// const couponCollection = mongoose.model('collectionOfCoupon', couponSchema);
// module.exports = couponCollection;
const mongoose = require('mongoose');
const cron = require('node-cron');

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
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

couponSchema.index({ expiryDate: 1 });

couponSchema.statics.removeExpiredCoupons = async function () {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    await this.deleteMany({ expiryDate: { $lte: oneDayAgo } });
};

const couponCollection = mongoose.model('Coupon', couponSchema);

cron.schedule('0 0 * * *', async () => {
    console.log('Running job to remove expired coupons...');
    await couponCollection.removeExpiredCoupons();
    console.log('Job completed.');
});

module.exports = couponCollection;