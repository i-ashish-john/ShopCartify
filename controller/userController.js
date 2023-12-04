const { verify } = require('crypto');
const userCollection = require('../model/userCollection');
const productCollection = require('../model/productCollection');
// const categoryCollection = require('../model/categoryCollection');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const generateOtp = require('generate-otp');
const { log } = require('console');
const cartCollection = require('../model/cartCollection');
const addressCollection = require('../model/addressCollection');
const orderCollection = require('../model/orderCollection');

require('dotenv').config();
let otp;


const home = async (req, res) => {
  try {
    console.log("* This is home");
    const fetchedUser = await userCollection.find();
    const products = await productCollection.find();
    return res.render("user/home", { user: fetchedUser, products: products });

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error ");
  }
};


const login = async (req, res) => {
  try {
    if (req.session.user) {
      const fetchedUser = await userCollection.find();
      const products = await productCollection.find();
      res.render('user/home', { user: fetchedUser, products: products });

    } else {
      res.render('user/userlogin');

    }
  } catch (error) {
    console.log(error);
  }
};

const loginpost = async (req, res) => {
  try {
    const user = await userCollection.findOne({ email: req.body.email });

    if (user && !user.isblocked && user.password === req.body.password) {
      req.session.user = req.body.email;
      const fetchedUser = await userCollection.find();
      const products = await productCollection.find();
      res.render('user/home', { user: fetchedUser, products: products });
    } else {
      res.render('user/userlogin', { validation: 'Invalid username or password' });
    }
  } catch (error) {
    console.log('*CATCH ERROR', error);
    res.status(500).send('<h1 style="text-align: center; margin-top: 250px;">Internal Server  Error</h1>');
  }
};


const cartload = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user; 
      const userData = await userCollection.findOne({ email: userId });
      const cartDocument = await cartCollection.find({ userId: userData._id }).populate('productId');
      if (!cartDocument || cartDocument.length === 0) {
        res.render('user/cart', { userData, cartDocument, message: 'No items in cart' });
      } else {
        res.render('user/cart', { userData, cartDocument });
      }
    } else {
      res.status(401).send('You must be logged in to view your cart');
    }
  } catch (error) {
    console.error('Error in cartload:', error);
    res.status(500).send('An error occurred while processing your request');
  }
 };
 

 const addToCart = async (req, res) => {
  try {
    const productId = req.query.id;
    console.log("product id is",productId);
    const users = req.session.user;
 
    if (!users) {
      return res.status(401).send('Unauthorized. Log in to continue.');
    }
 
    const product = await productCollection.findById(productId);
    console.log("the products:",product);
    const user = await userCollection.findOne({ email: users });
 
    if (!product || !user) {
      return res.status(404).send('Product or user not found.');
    }
 
    const cartItem = await cartCollection.findOne({ userId: user._id, productId: product._id });
 
    if (cartItem) {
      await cartCollection.findOneAndUpdate(
        { _id: cartItem._id },
        { $inc: { quantity: 1 } }
      );
    } else {
      const price = product.price;
      const cartData = { userId: user._id, productId: product._id, price: price,  images: product.Images[0], quantity: 1 };
      await cartCollection.create(cartData);
    }
 
    res.redirect('/Totallistpro');
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }
 };
 
 

// Assuming you have a route or controller method for adding to the cart

const signout = (req, res) => {

  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    } else {
      res.render('user/userlogin');
    }
  });
};

const signup = async (req, res) => {
  const passwordError = '';
  const emailError = '';
  res.render('user/signup', { emailError, passwordError });
};

const signupPost = async (req, res) => {
  try {
    const newUser = {
      name: req.body.username,
      email: req.body.email,
      password: req.body.password
    }
    req.session.user = newUser;
    const email = req.body.email;
    const existingUser = await userCollection.findOne({ email });

    if (existingUser && newUser.password.length < 8) {
      const passwordError = 'Password must be at least 8 characters long';
      const emailError = '';
      res.render('user/signup', { passwordError, emailError });
      return;
    } else if (existingUser) {
      const passwordError = '';
      const emailError = "Try with other email"
      res.render('user/signup', { passwordError, emailError });
      return;
    }

    // Rest of your code for sending OTP
    const password = req.body.password;
    const otp = generateOtp.generate(6, { digits: true, alphabets: false, specialChars: false });
    const otpExpiresAt = new Date();
    const expirationMinutes = 5;
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + expirationMinutes);

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'testtdemoo11111@gmail.com',
        pass: 'wikvaxsgqyebphvh',
      },
    });

    const mailOptions = {
      from: 'johnashish509@gmail.com',
      to: email,
      subject: 'Your OTP code',
      text: `Your OTP code is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({ error: 'Error sending OTP' });
      } else {
        console.log('OTP sent:', info.response);
        console.log(mailOptions);
        console.log('Successfully sent');
        console.log("SUCESSFULLY SEND ERROR IS HERE", otp);
        req.session.otp = otp;
        const error = ''
        res.render('user/OTP', { error });
      }
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const sendOTPByEmail = async (req, res) => {
  try {
    const enteredOtp = req.body.otp;
    console.log("Entered OTP:", enteredOtp);
    console.log("THE OTP IS HERE", req.session.otp);
    if (req.session.otp === enteredOtp) {
      const users = await userCollection.find();
      const products = await productCollection.find();
      const EnteringData = req.session.user;

      console.log("THE SESSION OF USER IS", req.session.user);

      await userCollection.insertMany([EnteringData]);
      res.render("user/home", { users, products });
    } else {
      res.render("user/OTP", { error: "Incorrect OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error in OTP verification:", error);
    res.status(500).send("Internal Server Error");
  }
};



const productdetails = async (req, res) => {
  try {
    console.log("product details");

    const data = req.query.id;
    console.log("THE QUERY ID IS :", req.query.id);
    req.session.product = data;
    // req.session.product = data;
    console.log("id of the product: " + req.session.product);

    const product = await productCollection.findById(data);

    if (!product) {
      // Clear the session if the product is not found
      return res.status(404).send('Product not found');
    } else {
      // Render the product details page
      res.render("user/productdetails", { product });
    }
  } catch (error) {
    console.error("Error retrieving product details:", error);
    res.status(500).send('Internal Server Error');
  }
};

const back = async (req, res) => {

  const fetchedUser = await userCollection.find();
  const products = await productCollection.find();
  res.render("user/home", { user: fetchedUser, products: products });
};

const Totalproductlist = async (req, res) => {

  const user = await userCollection.find();
  const products = await productCollection.find();
  res.render('user/Totalproductlisting', { user, products });
};


const cartItemRemove = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user;
    // console.log('Product ID:', productId);
    // console.log('User ID:', userId);

    // Delete the item from the cart of the user
    const finded = await cartCollection.findOneAndDelete({ productId });
    // const cartDocument = await cartCollection.findOne({ email: userId });

    if (finded) {
      res.redirect('/cartload');
      console.log("LOGGED FIND", finded);
    } else {
      // Fetch the updated cart items after removal
      // res.redirect('/cartload');
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateCartItem = async (req, res) => {
  console.log("HELLO");
  try {
    const { action, productId } = req.body;
    // const productId = req.params.productId;
    // const userId = req.session.user;
    console.log("req.session.user: " + req.session.user);
    console.log("productId: " + productId);

    const cartItem = await cartCollection.findOne({
      userId: userId,
      productId: productId
    });

    console.log("cartItem: ", cartItem);

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (action === 'decrease' && cartItem.quantity > 1) {
      cartItem.quantity -= 1;
    } else if (action === 'increase') {
      cartItem.quantity += 1;
    }

    await cartItem.save();

    const totalPrice = cartItem.price * cartItem.quantity;

    res.json({ message: 'Request handled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const incCart = async (req, res) => {
  try {
    const pid = req.params.id;

    // Find the cart item
    const item = await cartCollection.findOne({ productId: pid });

    // Check if the item exists
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Get product information
    const productStock = (await productCollection.findById(pid)).Stock;

    // Check if the new quantity exceeds the available stock
    const newQuantity = item.quantity + 1;
    if (newQuantity > productStock) {
      return res.status(400).json({
        success: false,
        message: 'Cannot increase quantity, not enough stock available'
      });
    }

    // Calculate new price
    const newPrice = item.price * newQuantity;

    // Update the quantity in the database using productId as the filter
    await cartCollection.updateOne(
      { productId: pid },
      { $set: { quantity: newQuantity } }
    );

    // Calculate the overall total price (sum of prices for all items in the cart)
    const overallTotalPrice = await calculateOverallTotalPrice();

    // Send the response including the newOverallTotalPrice
    res.status(200).json({
      success: true,
      newQuantity,
      newPrice,
      newOverallTotalPrice: overallTotalPrice,
      message: 'Quantity increased successfully'
    });
  } catch (error) {
    console.error(error);

    // Handle specific errors
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};


const decCart = async (req, res) => {
  try {
    const pid = req.params.id;
    const item = await cartCollection.findOne({ _id: pid });

    // Ensure the quantity does not go below 1
    const newQuantity = Math.max(item.quantity - 1, 1);
    console.log("Item Price:", item.price);
    console.log("New Quantity:", newQuantity);
    const newPrice = item.price * newQuantity;
    
    // Update the quantity in the database
    console.log("New Quantity:", newQuantity);
    await cartCollection.updateOne(
      { _id: pid },
      { $set: { quantity: newQuantity } }
    );
    
    

    // Calculate the overall total price (sum of prices for all items in the cart)
    const overallTotalPrice = await calculateOverallTotalPrice();

    res.status(200).json({
      success: true,
      newQuantity,
      newPrice,
      newOverallTotalPrice: overallTotalPrice,
      message: 'Quantity decreased successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error decreasing quantity',
      error: error.message
    });
  }
};

// Function to calculate overall total price
const calculateOverallTotalPrice = async () => {
  const cartItems = await cartCollection.find({});
  let overallTotalPrice = 0;

  // Sum up the prices for all items in the cart
  for (const item of cartItems) {
    const itemPrice = parseFloat(item.price);
    overallTotalPrice += item.quantity * itemPrice;
  }

  return overallTotalPrice;
};


const checkout = async (req, res) => {
  try {
    const users = req.session.user;
    const user = await userCollection.find({email:users});
    console.log(user); // Log the user data
    const addresses = await userCollection.find({ userId: user._id });
    console.log("addresses",addresses);
    res.render('user/checkout', { addresses });
    console.log("addresses is here",addresses);
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }
 };
 
 

const submitAddress = async (req, res) => {
  try {
    // Assuming the form data is available in req.body
    console.log("ENTERED IN SUBMIT");
    const formData = req.body;
    console.log("REQ.BODY", req.body);

    // Save the form data to the addressCollection model
    const newAddress = new addressCollection({
      userId: formData.userId._id,
      productId: formData.productId._id,
      cartId: formData.cartId._id,
      address: formData.address,
      street: formData.street,
      country: formData.country,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
    });

    const savedAddress = await newAddress.save();

    const totalPrice = formData.totalPrice;

    // Create a new order document using the orderCollection model
    const newOrder = new orderCollection({
      addressId: savedAddress._id,
      totalPrice: totalPrice, // Use the variable you defined
      // Add other fields as needed
    });

    const savedOrder = await newOrder.save();

    // Render the order success page with the order details
    res.render('user/ordersuccess', {
      order: savedOrder,
      // Add other variables as needed
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error processing form:', error.message);
    res.render('error', { error: 'An error occurred while processing the form.' });
  }
};



const orderStatus = async (req, res) => {
  try {
    console.log("entered in to order status");
    const stored = req.session.user;
    console.log("STORED SESSION", req.session.user);
    if (stored) {
      console.log("session of user in the  order status", req.session.user);

      return res.render('user/displayOrderStatus');
    }
  } catch (error) {
    console.error(error.message);
    console.log("error inside the order status get");
    res.status(500).send('Internal Server Error'); // Send an error response if there's an issue
  }
};

// const profile = async (req, res) => {
//   try {
//     const Email = req.session.user;

//     const updatedBody = {
//       street: req.body.street,
//       city: req.body.city,
//       state: req.body.state,
//       zip: req.body.zip
//     };
//     if (!updatedBody.street || !updatedBody.city || !updatedBody.state || !updatedBody.zip) {
//       return res.status(400).send('Missing required fields');
//     }
//     const user = await userCollection.findOne({ email: Email });
//     if (!user) {
//       return res.status(404).send('User not found');
//     }
//     user.address.forEach((address) => {
//       address.street = updatedBody.street;
//       address.city = updatedBody.city;
//       address.state = updatedBody.state;
//       address.zip = updatedBody.zip;
//     });
//     await Promise.all(user.address.map((address) => address.save()));
//     res.redirect('/');
//     console.log("AAGAYA");
//   } catch (error) {
//     console.error('Error updating user details:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };








// UserDetails function
const UserDetails = async (req, res) => {
  try {
    const userEmail = req.session.user;
    const updateResult = await userCollection.updateOne(
      { email: userEmail },
      {
        $set: {
          'address.street': req.body.street,
          'address.country': req.body.country,
          'address.city': req.body.city,
          'address.state': req.body.state,
          'address.zip': req.body.zip,
        },
      }
    );
    
    if (updateResult.matchedCount > 0) {
      // Successful update, redirect to the root path
      res.redirect('/');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
 };
 


 const profile = async (req, res) => {
  try {
    const store = req.session.user;
    console.log("Stored in profile");
    const user = await userCollection.findOne({ email:store }) || {};
    // const address = (user.address && user.address[0]) || {};
    const address = (Array.isArray(user.address) && user.address.length > 0) ? user.address[0] : {};

    const street = address.street || '';
    const city = address.city || '';
    const state = address.state || '';
    const country = address.country || '';
    const zip = address.zip || '';

    res.render('user/userProfile', { user, street, city, state, country, zip });
  } catch (error) {
    console.log("Error in profile get");
    console.log(error.message);
  }
};

const addAddressUserPage = async(req,res)=>{
  res.render('user/addAddressUser');
}


const NewAddressAddedForUser = async (req, res) => {
  try {
    const newData = {
      street: req.body.street,
      country: req.body.country,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip
    };
 const userEmail = req.session.user
 console.log("userEmail",userEmail,req.session.user)
   
        const updatedUser = await userCollection.findOneAndUpdate(
      {email:userEmail},
      {$push:{
        'address':newData
      }},
      { new: true }
        );
        if (updatedUser) {
          return res.redirect('/home');
        
      } else {
        res.render('/home');
      console.log("update user", updatedUser)

    res.send("Internal Server Error");
  } 
}catch(error) {
    console.log(error); // Log the entire error object
    res.send("Internal Server Error: " + error.message);
  }
 };
 


module.exports = {
  login, loginpost, signout,
  signupPost, signup, home, cartload,
  sendOTPByEmail, back, productdetails,
  Totalproductlist, cartItemRemove, addToCart,
  updateCartItem, incCart, decCart, checkout,
  submitAddress,  orderStatus, UserDetails,profile,
  addAddressUserPage,NewAddressAddedForUser
};
//  ,orderSuccess};,userProfile