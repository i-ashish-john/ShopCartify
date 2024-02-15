const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({

        image: {
            data: String,
            contentType: String,
        },
        bannerTittle:{
            type:String,
            require:true
        },
        bannerSubtittle:{
            type:String,
            required:true
        },
        bannerUrl:{
            type:String,
            required:true
        }
});

const bannerCollection = new mongoose.model('collectionOfBanner',bannerSchema);
module.exports = bannerCollection;