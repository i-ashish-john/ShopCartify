const session = require('express-session');
const mongoose = require('mongoose');
const adminCollection = require('../model/adminCollection')
const userCollection = require('../model/userCollection');
const productCollection = require('../model/productCollection');
const CategoryCollection = require('../model/categoryCollection');
const orderCollection = require('../model/orderCollection');
const addressCollection = require('../model/addressCollection');
const returnCollection = require('../model/returnCollection');
const walletCollection = require('../model/walletCollection');
const couponCollection = require('../model/couponCollection');
const moment = require('moment');
const excel = require('exceljs');
const stream = require('stream');

const sharp = require('sharp');

const { log } = require('console');

const multer = require('multer');

const uploads = multer({ dest: "public/uploads" });
//below is sperate gunction for the chart displaying
const getWeeklyOrderCount = async () => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date();
    endOfWeek.setHours(23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

    const orderCount = await orderCollection.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfWeek,
            $lte: endOfWeek,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
        },
      },
    ]);

    if (orderCount && orderCount.length > 0 && orderCount[0].totalOrders !== undefined) {
      const [{ totalOrders }] = orderCount;
      return orderCount;
    } else {
      return 0; // Handle the case where totalOrders is not available
    }
  } catch (error) {
    console.error("Error in getWeeklyOrderCount:", error);
    return 0; // Handle the error by returning a default value
  }
};

const getMonthlyOrderCount = async () => {
  const currentYear = new Date().getFullYear();
  console.log("reached");

  const monthlyCounts = await orderCollection.aggregate([
    {
      $match: {
        orderDate: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        totalOrders: 1,
      },
    },
  ]);
  return monthlyCounts;
};

const getYearlyOrderCount = async () => {
  const yearlyCount = await orderCollection.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y', date: '$orderDate' } },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id',
        totalOrders: 1,
      },
    },
  ]);
  return yearlyCount;
};


const dashboardForAdmin = async (req, res) => {
  const ITEMS_PER_PAGE = 10;
 const page = parseInt(req.query.page) || 1;
 const skip = (page - 1) * ITEMS_PER_PAGE;
 const fullData = await orderCollection.find().skip(skip).limit(ITEMS_PER_PAGE);
 const totalCount = await orderCollection.countDocuments();
 const weeklyOrderCount = await getWeeklyOrderCount();
 const monthlyOrderCounts = await getMonthlyOrderCount();
 const yearlyOrderCount = await getYearlyOrderCount();
 res.render('admin/dashboard', {
    fullData,
    weeklyOrderCount,
    monthlyOrderCounts,
    yearlyOrderCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
 });
}


const dashboard = async (req, res) => {
  try {
    if (req.session.admin) {  
      const ITEMS_PER_PAGE = 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const fullData = await orderCollection.find().skip(skip).limit(ITEMS_PER_PAGE);
      const totalCount = await orderCollection.countDocuments();
      const weeklyOrderCount = await getWeeklyOrderCount();
      const monthlyOrderCounts = await getMonthlyOrderCount();
      const yearlyOrderCount = await getYearlyOrderCount();
      res.render('admin/dashboard', {
         fullData,
         weeklyOrderCount,
         monthlyOrderCounts,
         yearlyOrderCount,
         currentPage: page,
         totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
      });
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
    const ITEMS_PER_PAGE = 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const fullData = await orderCollection.find().skip(skip).limit(ITEMS_PER_PAGE);
    const totalCount = await orderCollection.countDocuments();
    const weeklyOrderCount = await getWeeklyOrderCount();
    const monthlyOrderCounts = await getMonthlyOrderCount();
    const yearlyOrderCount = await getYearlyOrderCount();
    res.render('admin/dashboard', {
       fullData,
       weeklyOrderCount,
       monthlyOrderCounts,
       yearlyOrderCount,
       currentPage: page,
       totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
    });
  } else {
    res.render('admin/login')
  }
};
const postlogin = async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is not provided or contains only spaces
  if (!username || !password || username.trim() === '' || password.trim() === '') {
    // Render login page with an error message
     res.render('admin/login', { errorMessage: 'Username and password are required.' });
  }

  try {
    const admin = await adminCollection.findOne({ username: username, password: password });
    const users = await userCollection.find();
    const fullData  = await orderCollection.find();
    if (admin && admin.password === password) {
      req.session.admin = username;

      const users = await userCollection.find();
      console.log("user in the post login", users);
      const ITEMS_PER_PAGE = 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const fullData = await orderCollection.find().skip(skip).limit(ITEMS_PER_PAGE);
      const totalCount = await orderCollection.countDocuments();
      const weeklyOrderCount = await getWeeklyOrderCount();
      const monthlyOrderCounts = await getMonthlyOrderCount();
      const yearlyOrderCount = await getYearlyOrderCount();
      res.render('admin/dashboard', {
         fullData,
         users,
         weeklyOrderCount,
         monthlyOrderCounts,
         yearlyOrderCount,
         currentPage: page,
         totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
      });
    } else {
      // Render login page with an error message if admin is not found or password is incorrect
      res.render('admin/login', { errorMessage: 'Invalid username or password.' });
    }
  } catch (error) {
    console.log(error);
    res.render('admin/login', { errorMessage: 'An error occurred during login.' });
  }
};

const createPost = async (req, res) => {
  const createData = {
    username: username,
    password: password,
    email: email
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


const ITEMS_PER_PAGE = 10; 
const usermanage = async (req, res) => {
  const page = parseInt(req.query.page) || 1; //neede page requesting
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const users = await userCollection.find().skip(skip).limit(ITEMS_PER_PAGE);
  const totalCount = await userCollection.countDocuments();
  res.render("admin/userManagement", { users, currentPage: page, totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE) });
};


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

//     // Array to store paths of cropped images
//     const croppedImages = [];

//     // Loop through each uploaded image and crop it
//     for (const file of req.files) {
//       console.log("file is:",file);

//       const croppedImagePath = `public/uploads/cropped${file.filename}`; 
//       // const croppedImagePath = path.join('public', 'uploads', 'cropped', `${file.filename}`);

//       await sharp(file.path)
//         .resize({ width: 300, height: 300 })
//         .toFile(croppedImagePath);

//       croppedImages.push(croppedImagePath);
//     }

//     console.log("croppedImages", croppedImages);

//     console.log('body', req.body);
//     const productDetails = {
//       name: name,
//       price: price,
//       currency: currency,
//       category: category,
//       stock: stock,
//       description: description,
//       Images: croppedImages
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
    console.log("req.files", req.files);
    console.log("Product management Post Image is updating");
    const images = req.files.map(file => `public/uploads/${file.filename}`);

    if (!req.body.Name.trim() || !req.body.price.trim() || !req.body.category.trim() || !req.body.stock.trim() || !req.body.description.trim() ) {
      return res.render('admin/productAdd', { productError: 'All fields are required and cannot be just spaces' });
    }

    console.log('body', req.body);
   console.log("name of the product in the productManagePost",req.body.Name);
    const productDetails = {
      name:req.body.Name,
      price:req.body.price,
      category:req.body.category,
      stock:req.body.stock,
      description:req.body.description,
      Discount:req.body.Discount,
      Images:images,
    };

    const Product = await productCollection.insertMany([productDetails]);
    if (productDetails && Product) {
      res.redirect('/admin/productlist');
    } else {
      res.redirect('/admin/productAdd');
    }
  } catch (error) {
    console.log('error in add post*');
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

// module.exports = {
//   productmanagePost,
// };
const productlist = async (req, res) => {
  try {
    const fullProducts = await productCollection.find();
    const categories = await CategoryCollection.find();

    let query = {};
    const searchTerm = req.query.search;

    if (searchTerm) {
      query = { $or: [{ name: { $regex: searchTerm, $options: 'i' } }], deleted: false };
    } else {
      query = { deleted: false };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const totalProducts = await productCollection.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const skip = (page - 1) * limit;
    const products = await productCollection.find(query).skip(skip).limit(limit);
    res.render("admin/productManagement", {
      categories,
      fullProducts,
      products,
      currentPage: page,
      totalPages,
      searchTerm,
    });
  } catch (error) {
    console.error("Error in productlist:", error);
    res.status(500).send("Internal Server Error");
  }
};


const productDelete = async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate ObjectId to prevent invalid queries
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log("Invalid product ID");
      return res.status(400).send("Invalid product ID");
    }

    // Soft delete by updating the 'deleted' field
    const newResult = await productCollection.findByIdAndUpdate(
      productId,
      { $set: { deleted: true } },
      { new: true }
    );

    if (newResult) {
      res.redirect('/admin/productlist');
    } else {
      console.log("Product not found");
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.send(error.message)
  }
};

const updateproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productCollection.findById(productId);
    const { name, description, price, stock,Discount } = req.body;
    console.log("the discount  of the product is:", Discount);
    // Handling Images separately
    let updatedImages = product.Images;

    if (req.files && req.files.length > 0) {
      updatedImages = req.files.map(file => `public/uploads/${file.filename}`);
    }

    const updatedProduct = await productCollection.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        price,
        stock,
        Discount,
        Images: updatedImages,
      },
      { new: true }
    );
  
    if (!updatedProduct) {
      console.error("Product not found for update");
      return res.status(404).send("Product not found");
    }

    res.redirect("/admin/productlist");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
};


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
    // Check if category name or category description is empty
    if (!datas.categoryName || !datas.categoryDescription) {
      return res.render('admin/categoryAdd', { categoryError: 'Category name and description are required' });
    }
    if (!datas.categoryName.trim() || !datas.categoryDescription.trim()) {
      return res.render('admin/categoryAdd', { categoryError: 'Category name and description are required and cannot be just spaces' });
    }
    

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
    const fullProducts = await productCollection.find();
    let query = {};
    const searchTerm = req.query.search;
 
    if (searchTerm) {
      query = { $or: [{ name: { $regex: searchTerm, $options: 'i' } }], deleted: false };
    } else {
      query = { deleted: false };
    }
 
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
 
    const totalProducts = await productCollection.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
 
    const skip = (page - 1) * limit;
    const products = await productCollection.find(query).skip(skip).limit(limit);
    res.render("admin/productManagement", {
      categories,
      fullProducts,
      products,
      currentPage: page,
      totalPages,
      searchTerm,
    });
  } catch (error) {
    // Handle any errors, for example, log the error and render an error page
    console.error("Error fetching categories:", error);
  }
};


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
    console.log("the data  is here 1211212");
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
    let page = parseInt(req.query.page) || 1;
    const limit = 10;

    // Calculate the skip value based on the page number
    const skip = (page - 1) * limit;

    // Fetch orders with pagination and populate productdetails
    const orders = await orderCollection
      .find()
      .populate('productdetails')
      .skip(skip)
      .limit(limit);

    // Count total orders for pagination
    const totalOrders = await orderCollection.countDocuments();

    // Calculate total pages based on the limit
    const ITEMS_PER_PAGE = 10;
 const fullData = await orderCollection.find().skip(skip).limit(ITEMS_PER_PAGE);
 const totalCount = await orderCollection.countDocuments();
 const weeklyOrderCount = await getWeeklyOrderCount();
 const monthlyOrderCounts = await getMonthlyOrderCount();
 const yearlyOrderCount = await getYearlyOrderCount();

 res.render('admin/dashboard', {
    orders,
    daycount,
    fullData,
    weeklyOrderCount,
    monthlyOrderCounts,
 yearlyOrderCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
 });
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
};


const ordersPost = async (req, res) => {
  try {
    console.log(" HERE HERE HERE HERE HERE HERE HERE HERE HEREH HERE HERE HERE HERE");
      const orderId = req.params.id;
      const newStatus = req.body.orderStatus;
      console.log("new status:",newStatus);
      const updatedOrder = await orderCollection.findByIdAndUpdate(
          orderId,
          { $set: { orderStatus: newStatus } },
          { new: true }
      );
 
      console.log("Updated Order:", updatedOrder);
      // res.status(200).json(updatedOrder);
      res.redirect('/admin/dashboard');
  } catch (error) {
      console.send(error.message);
  }    
 };
 
 const returnManage = async (req, res) => {
  try {
     const pageSize = 3;
     const currentPage = req.query.page || 1; 
 
     const skip = (currentPage - 1) * pageSize;
 
     const orderData = await orderCollection.find().skip(skip).limit(pageSize);
     const returnDetails = await returnCollection.find().skip(skip).limit(pageSize);
 
     const totalOrders = await orderCollection.countDocuments();
     const totalReturns = await returnCollection.countDocuments();

     const totalPages = Math.ceil(Math.max(totalOrders, totalReturns) / pageSize);
 
     res.render("admin/returnOrderManage", {
       orderData,
       returnDetails,
       currentPage,
       totalPages,
     });
  } catch (error) {
     res.send(error.message);
     console.log(error.message);
  }
 };
 

 const Approved = async (req, res) => {
  try {
    const orderId = req.params.id;
    const data = await returnCollection.findOne({ orderId: orderId });
    if (!data) {
      return res.status(404).json({ message: "Order not found" });
    }
    const returnStatus = "return approved";
    const constConfirmReturn = await returnCollection.findByIdAndUpdate(
      data._id,
      { $set: { status: returnStatus, time: Date.now() } },
      { new: true }
    );
    if (constConfirmReturn.status === returnStatus) {
      let walletSave = await walletCollection.findOne({ userId: data.userId });
      if (!walletSave) {
        let newWalletSave = new walletCollection({
          userId: data.userId,
          creditAmounts: [data.amount], // Save data.amount in creditAmounts
          debitAmounts: [],
        });
        await newWalletSave.save();
      } else {
        walletSave.creditAmounts.push(data.amount); // Save data.amount in creditAmounts
        await walletSave.save();
      }
      res.json({ status: returnStatus });
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};



const Denyed = async (req, res) => {
  try {
    console.log("111111");
    const orderId = req.params.id;
    const Data = await returnCollection.findOne({ orderId });

    console.log("entered into the admin denied section");
    console.log("22222");
    await returnCollection.findByIdAndUpdate(Data._id, { $set: { status: "return request rejected by admin" } });
    res.status(200).send({ status: "return rejected by admin" });
  } catch (error) {
    console.log("internal error in denied section ");
    res.status(500).send(error);
  }
};


const getMonthlyData = async(req,res)=>{
  try {
    console.log("reached in monthly dta");
    const last12Months = Array.from({ length: 12 }, (_, i) =>
      moment().subtract(i, 'months').format('MMMM YYYY')
    );
    const monthlyData = await orderCollection.aggregate([
      {
        $match: {
          orderDate: {
            $gte: moment().subtract(12, 'months').toDate(),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$orderDate' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    const labels = last12Months;
    const values = monthlyData.map((monthData) =>
      monthData ? monthData.totalOrders : 0
    );
    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getYearlyData = async(req,res)=>{

  try {
    // Example: Fetch yearly order data for the last 5 years
    const last5Years = Array.from({ length: 5 }, (_, i) =>
      moment().subtract(i, 'years').format('YYYY')
    );

    const yearlyData = await orderCollection.aggregate([
      {
        $match: {
          orderDate: {
            $gte: moment().subtract(5, 'years').toDate(),
          },
        },
      },
      {
        $group: {
          _id: { $year: '$orderDate' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const labels = last5Years;
    const values = yearlyData.map((yearData) =>
      yearData ? yearData.totalOrders : 0
    );

    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching yearly data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const excelDownload = async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    console.log("hwllooo");
    const orders = await orderCollection
      .find({
        orderDate: { $gte: startDate, $lte: endDate },
      })
      .populate('productdetails'); 

      console.log("orders",orders);// Assuming 'productdetails' is the field referencing the 'collectionOfProduct' model
    if (!orders || orders.length === 0) {
      return res.status(404).send("No orders found");
    }
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("Orders");

    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 12 },
      { header: "Customer Name", key: "username", width: 20 },
      { header: "Email", key: "email", width: 20 },
      { header: "TotalPrice", key: "totalPrice", width: 20 },
      { header: "OrderStatus", key: "orderStatus", width: 20 },
      { header: "Street", key: "street", width: 20 },   
      { header: "Country", key: "country", width: 20 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 20 },
      { header: "Zip", key: "zip", width: 20 },
    ];
    orders.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        username: order.username,
        email: order.email,
        totalPrice: order.totalPrice,
        orderStatus: order.orderStatus,
        street: order.address.street, 
        country: order.address.country,
        city: order.address.city,
        state: order.address.state,
        zip: order.address.zip,
      });
    });
    
    const streamifier = new stream.PassThrough();

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
   
    res.send(buffer);

    streamifier.pipe(res);
  } catch (error) {
    console.error("Error due to excel:", error);
    res.status(500).send("Error due to excel");
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
  ordersPost,
  returnManage,
  Approved,
  Denyed,
  getMonthlyData,
  getYearlyData,
  excelDownload
}