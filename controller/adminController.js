const session = require('express-session');
const adminCollection = require('../model/adminCollection')
const userCollection = require('../model/userCollection');
const productCollection = require('../model/productCollection');
const CategoryCollection = require('../model/categoryCollection');
const orderCollection = require('../model/orderCollection');
const sharp = require('sharp');

const { log } = require('console');

const multer = require('multer');

const uploads = multer({ dest: "public/uploads" });

const dashboardForAdmin = async (req, res) => {
  res.render('admin/dashboard');
}

const dashboard = async (req, res) => {
  try {
    if (req.session.admin) {  
      res.render('admin/dashboard');
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
    // res.status(500).render('error', { error: 'An error occurred in the dashboard.' });
  }
};

const adminlogin = async (req, res) => {
  if (req.session.admin) {
    const users = await userCollection.find();
    res.render('admin/dashboard', { users });
  } else {
    res.render('admin/login')
  }
};

const postlogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await adminCollection.findOne({ username: username, password: password });
    const users = await userCollection.find();
    if (admin.password === req.body.password) {
      req.session.admin = username;

      const users = await userCollection.find()
      console.log("user", users);

      res.render('admin/dashboard', { users })
    }
  } catch (error) {
    console.log(error);
    res.render('admin/login');
  }
};




const createPost = async (req, res) => {
  const createData = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  }

  await adminCollection.create(createData);
  console.log("admin created a user");
  res.redirect('/admin/dashboard');
};

const blockid = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userCollection.findByIdAndUpdate(id, { isblocked: true });

    if (!user) {
      res.status(400).json({ error: 'User not found or could not be blocked' });
    } else {
      res.redirect('/admin/usermanage');
    }
  } catch (error) {
    console.error(error.message);
    res.send( error.message );
  }
};


const unblockid = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userCollection.findByIdAndUpdate(id, { isblocked: false });

    if (!user) {
      res.status(400).json({ error: 'User not found or could not be unblocked' });
    }
    res.redirect('/admin/usermanage');
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }
};


const usermanage = async (req, res) => {
  const users = await userCollection.find()
  res.render("admin/userManagement", { users })
}

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    else {

      res.redirect('/admin/login')
    }
  });
};


const productmanage = async (req, res) => {
  try {
    res.render("admin/productAdd");
  } catch (error) {
    console.log("error in productlist", error);
  }
};


// const productmanagePost = async (req, res) => {
//   try {
//     // Call the Multer middleware to handle file uploads


//     console.log("req.files", req.files);
//     const uploadedImages = req.files.map(file => {
//       console.log(file);
//       let imagepath = file.path
//       return imagepath;
//     });
//     console.log("uploadedImages ", uploadedImages)


//     // Your existing code for handling product details and database insertion
//     console.log('body', req.body);
//     const productDetails = {
//       name: req.body.name,
//       price: req.body.price,
//       currency: req.body.currency,
//       category: req.body.category,
//       stock: req.body.stock,
//       description: req.body.description,
//       Images: uploadedImages

//     };

//     const Product = await productCollection.insertMany([productDetails]);

//     if (productDetails && Product) {
//       res.redirect('/admin/productlist');
//     } else {
//       res.redirect('/admin/productAdd');
//     }
//   } catch (error) {
//     console.log('error in add post*');
//     console.log(error);
//   }
// };


const productmanagePost = async (req, res) => {
  try {
    // Call the Multer middleware to handle file uploads
    console.log("req.files", req.files);

    // Array to store paths of cropped images
    const croppedImages = [];

    // Loop through each uploaded image and crop it
    for (const file of req.files) {
      console.log(file);

      const croppedImagePath = `public/images${file.filename}`; 
      await sharp(file.path)
        .resize({ width: 300, height: 300 })
        .toFile(croppedImagePath);

      croppedImages.push(croppedImagePath);
    }

    console.log("croppedImages", croppedImages);

    console.log('body', req.body);
    const productDetails = {
      name: req.body.name,
      price: req.body.price,
      currency: req.body.currency,
      category: req.body.category,
      stock: req.body.stock,
      description: req.body.description,
      Images: croppedImages
    };

    const Product = await productCollection.insertMany([productDetails]);

    if (productDetails && Product) {
      res.redirect('/admin/productlist');
    } else {
      res.redirect('/admin/productAdd');
    }
  } catch (error) {
    console.log('error in add post*');
    console.log(error);
  }
};



const productlist = async (req, res) => {
  try {
    let query = {};
    const searchTerm = req.query.search;
    if (searchTerm) {
      query = { $or: [{ name: { $regex: searchTerm, $options: 'i' } }] };
    }
    const store = await productCollection.find(query);
    res.render("admin/productManagement", { store });
  } catch (error) {
    console.log("error in productlist", error);
  }
};

const productDelete = async (req, res) => {
  const data = req.params.id;
  const result = await productCollection.findByIdAndDelete(data);
  if (result) {
    res.redirect('/admin/productlist');
  } else {
    res.send(error);
    console.log("product deleted");
  }
};

// const updateproduct = async (req, res) => {
//   try {
//     const paramToUpdate = req.body.params;
//     console.log("Param to Update:", paramToUpdate);


//     // Construct the filter based on paramToUpdate
//     const filter = { _id: paramToUpdate }; // Assuming paramToUpdate is the product ID

//     const update = {
//       $set: {
//         name: req.body.name,
//         price: req.body.price,
//         currency: req.body.currency,
//         description: req.body.description,
//         // Add other fields to update as needed
//       },
//     };

//     // Use updateOne instead of updateMany if you want to update a single document
//     await productCollection.updateMany(filter, update);
//     // const store=await productCollection.find();
//     console.log("store is",store);
//     const product = await productCollection.find(filter);
//     console.log("PRODUCT", product);
//     if (product) {
//       res.render("admin/productManagement",{store});
//     } else {
//       res.redirect("/admin/productlist");
//     }
//   } catch (error) {
//     console.log("error in updateproduct:", error);
//     res.send(error);
//   }
// };


const updateproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, category, price } = req.body;
    const productToUpdate = await productCollection.findById(productId);
    const updatedProduct = await productCollection.findByIdAndUpdate(
      productId,
      {
        name,
        category,
        description,
        price,
      },
      { new: true } // Return the updated product
    );

    res.redirect("/admin/productlist")

  } catch (error) {
    res.send(error);
  }
};

// const editproduct=async(req,res)=>{
//  const paramToEdit=req.params.id;
//  const body=req.body;
//   const productEditted=await productCollection.findByIdAndUpdate(paramToEdit,body);
//   // const product=await productCollection.find();
//   if(productEditted){
//     res.render("admin/productlist");
//   }else{
//     res.redirect("/admin/editproduct");
//   }
// };

const editproduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("THE ID IS:", id);
    const product = await productCollection.findById(id);
    console.log("THE PROUDUCT IS:", product)
    if (product) {
      res.render("admin/productedit", { product });
      console.log("*********");
    } else {
      res.redirect("/admin/productlist");
    }
  } catch (error) {
    console.error("Error in editproduct:", error);
    res.status(500).send("Internal Server Error");
  }
};


const categoryadd = async (req, res) => {
  res.render('admin/categoryAdd');
};

const categoryaddPost = async (req, res) => {
  const datas = {
    categoryName: req.body.categoryName,
    categoryDescription: req.body.categoryDescription,
  };

  try {
    const existingCategory = await CategoryCollection.findOne({ categoryName: { $regex: new RegExp('^' + datas.categoryName + '$', 'i') } });
    const categories = existingCategory;
    if (existingCategory) {
      // Category with the same name already exists
      return res.render('admin/categoryAdd', { categoryError: 'Category with the same name already exists', categories });
    }

    await CategoryCollection.create(datas);
    res.redirect("/admin/categorymanage");
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};


const categorymanage = async (req, res) => {
  try {
    // Assuming categoryCollection is your MongoDB collection
    // const categories = await CategoryCollection.find({ deleted: false });
    const categories = await CategoryCollection.find();

    res.render("admin/categoryManagement", { categories });
  } catch (error) {
    // Handle any errors, for example, log the error and render an error page
    console.error("Error fetching categories:", error);
  }
};

// const categorydelete = async (req, res) => {
//   const data1 = req.params.id;
//   const result1 = await CategoryCollection.findByIdAndDelete(data1);
//   if (result1) {
//     res.redirect('/admin/categorymanage');
//   } else {
//     res.send(error);
//     console.log("product deleted");
//   }
// };

const categorydelete = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const result = await CategoryCollection.findByIdAndDelete(categoryId, { deleted: true });

    if (result) {
      res.redirect('/admin/categorymanage');
    } else {
      res.status(404).send('Category not found');
    }
  } catch (error) {
    console.error('Error in categorySoftDelete:', error);
    res.status(500).send('Internal Server Error');
  }
};

const categoryeditpage = async (req, res) => {
  console.log('editpage');
  try {
    const param = req.params.id;
    const categoriesData = await CategoryCollection.findById(param);
    const allCategories = await CategoryCollection.find();

    if (allCategories.length > 0) {
      res.render('admin/categoryedit', { categoriesData });
      console.log(categoriesData);
    } else {
      console.log('No categories found');
    }
  } catch (error) {
    console.log("Error in editpage:", error);
  }
};

const categoryedit = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updates = req.body; // Assuming updates are coming from the request body

    const result = await CategoryCollection.findByIdAndUpdate(categoryId, updates);

    if (result) {
      // Category updated successfully
      res.redirect("/admin/categorymanage"); // Redirect to the category management page
    } else {
      console.log('Error updating category');
    }
  } catch (error) {
    console.log(error);
    // Handle the error
  }
};

const orders = async (req, res) => {
  try {
    const orders = await orderCollection.find().populate('productdetails');
    res.render('admin/orders', { orders });
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }

};

const ordersPost = async (req, res) => {
  try {
      const orderId = req.params.id;
      const newStatus = req.body.orderStatus;

      const updatedOrder = await orderCollection.findByIdAndUpdate(
          orderId,
          { $set: { orderStatus: newStatus } },
          { new: true }
      );

      console.log("Updated Order:", updatedOrder);
      res.redirect("/admin/dashboardForAdmin");
  } catch (error) {
      console.error(error.message);
      res.send(error.message);
  }
};







module.exports = {
  dashboardForAdmin,
  dashboard,
  adminlogin,
  postlogin,
  // create,
  createPost,
  blockid,
  unblockid,
  usermanage,
  productmanage,
  productmanagePost,
  productlist,
  productDelete,
  categoryadd,
  updateproduct,
  editproduct,
  categorymanage,
  categorydelete,
  categoryeditpage,
  categoryedit,
  categoryaddPost,
  logout,
  orders,
  ordersPost

}