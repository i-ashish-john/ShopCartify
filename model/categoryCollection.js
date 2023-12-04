const mongoose = require('mongoose');

// Define the category schema
const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
   
  },
  categoryDescription: {
    type: String,
    required: true,
  },
  deleted: { 
    type: Boolean,
    default: false 
  }
});

// Create a Category model based on the schema
const CategoryCollection =new mongoose.model('collectionOfCategory', categorySchema);

module.exports = CategoryCollection
