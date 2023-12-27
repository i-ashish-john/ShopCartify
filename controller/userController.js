const { verify } = require('crypto');
const userCollection = require('../model/userCollection');
const productCollection = require('../model/productCollection');
// const categoryCollection = require('../model/categoryCollection');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const generateOtp = require('generate-otp');
const cartCollection = require('../model/cartCollection');
const addressCollection = require('../model/addressCollection');
const orderCollection = require('../model/orderCollection');

const { log } = require('console');
const mongoose = require('mongoose');
const Swal = require('sweetalert2')


require('dotenv').config();
let otp;


const home = async (req, res) => {
  try {
    console.log("* This is home");
    const loguser = req.session.user;
    const fetchedUser = await userCollection.find();
    const productsOfUser = await productCollection.find();
    const CartData = await cartCollection.findOne({ email: loguser });
    console.log("cart datas were :", CartData);
    return res.render("user/home", { user: fetchedUser, products: productsOfUser, cart: CartData });

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error ");
  }
};


const login = async (req, res) => {
  try {
    if (req.url === "/") {
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

    if (user) {
      if (user.isblocked) {
        res.render('user/userlogin', { blockedMessage: 'Your account is blocked. Please contact support.' });
        return;
      }
    }

    if (!req.body.email ) {
      return res.render('user/userlogin', { checkEmail: 'Email cannot be empty' });
    }

    if(!req.body.password){
      return res.render('user/userlogin',{checkPassword:'Password field cannot be empty '});
    }

    if (user && !user.isblocked && user.password === req.body.password) {
      req.session.user = req.body.email;
      const fetchedUser = await userCollection.find();
      const products = await productCollection.find();
      res.render('user/home', { user: fetchedUser, products: products });

    } else {
      res.render('user/userlogin', { validation: 'Invalid username or password' });
    }

    //above is for checking the user is blocked then it is used to use in the blocked middle ware

  } catch (error) {
    console.log(error.message);
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
  const usernameError = '';
  res.render('user/signup', { emailError, passwordError, usernameError });
};

const signupPost = async (req, res) => {
  try {
    const newUser = {
      name: req.body.username,
      email: req.body.email,
      password: req.body.password
    }

    if (/\d/.test(newUser.name)) {
      const usernameError = 'Username should not contain numbers';
      const passwordError = '';
      const emailError = '';
      res.render('user/signup', { usernameError, passwordError, emailError });
      return;
    }

    if(!newUser.name){
      const usernameError = 'User name is required';
      const passwordError = '';
      const emailError = '';
      res.render('user/signup',{usernameError,passwordError,emailError});
      return;
    }
    if(!newUser.email){
      const usernameError = '';
      const passwordError = '';
      const emailError = 'Email is required';
      res.render('user/signup',{usernameError,passwordError,emailError});
      return;
    }

    if(!newUser.password){
      const usernameError = '';
      const passwordError = 'Password is required';
      const emailError = '';
      res.render('user/signup',{usernameError,passwordError,emailError});
      return;
    }

    req.session.user = newUser;
    const email = req.body.email;
    const existingUser = await userCollection.findOne({ email });

    if (newUser.password.length < 8) {
      const passwordError = 'Password must be at least 8 characters long';
      const emailError = '';
      const usernameError = '';
      // res.render('user/signup', { passwordError, emailError,usernameError });
      res.render('user/signup', { passwordError, emailError ,usernameError});
      return;
    } else if (existingUser) {
      // const usernameError ='';
      const passwordError = '';
      const emailError = "Try with other email"
      const usernameError = '';

      // res.render('user/signup', { passwordError, emailError ,usernameError});
      res.render('user/signup', { passwordError, emailError,usernameError });

      return;
    }

    // Rest of your code for sending OTP
    const password = req.body.password;
    const otp = generateOtp.generate(6, { digits: true, alphabets: false, specialChars: false });
    req.session.otp = otp;
    req.session.user = newUser;
    const otpExpiresAt = new Date();
    const expirationMinutes = 1;
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
        res.render('user/OTP', { error:'', otp: req.session.otp });
      }
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
      console.log("here @@@@");
 
      // Clear the OTP from the session after successful verification
      delete req.session.otp;
 
      // Redirect to home page instead of rendering a page
      res.redirect("/home");
    } else {
      // Check if OTP has expired
      const otpExpiresAt = new Date(req.session.otpExpiresAt);
      const currentDateTime = new Date();
 
      if (currentDateTime > otpExpiresAt) {
        res.render("user/OTP", { error: "Incorrect OTP. Please try to signup again.", otp: req.session.otp });
      } else {
        res.render("user/OTP", { error: "Incorrect OTP. Please try to signup again.", otp: req.session.otp });
      }
    }
  } catch (error) {
    console.log("Error in OTP verification:", error);
    res.send("Internal Server Error");
  }
 };
 






const productdetails = async (req, res) => {
  try {
    console.log("product details");
    const data = req.query.id;
    console.log("data is :", data);
    console.log("THE PARAM ID IS :", req.query.id);
    req.session.product = data;
    console.log("id of the product: ", req.session.product);
    const product = await productCollection.findById(data);
    if (!product) {
      return res.status(404).send('Product not found');
    } else {
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


const MensTotalproductlist = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Get the requested page number from the query parameter
      const pageSize = 10; // Set the number of products to display per page

      // Example: Fetch products for the requested page
      const products = await productCollection.find({ category: "Mens" , deleted: false })
          .skip((page - 1) * pageSize)
          .limit(pageSize);
          if (products.length > 0) {
            const category = products[0].category; // Extract category from the first product
            console.log("The men's product is here#:", category);
      
            const totalProducts = await productCollection.countDocuments({ category: "Mens" });
            const totalPages = Math.ceil(totalProducts / pageSize);
      
            res.render('user/Totalproductlisting', { products, currentPage: page, totalPages, category });
          } else {
            // Handle the case where no products are found
            res.render('user/Totalproductlisting', { products: [], currentPage: page, totalPages: 0, category: null });
          }
    } catch (error) {
      console.log(error.message);
      res.send(error.message);
  }
};

const WomensTotalproductlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;

    // Example: Fetch products for the requested page
    const products = await productCollection.find({ category: "Womens" , deleted: false })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
      if (products.length > 0) {
        const category = products[0].category; // Extract category from the first product
        console.log("The women's product is here#:", category);
  
        const totalProducts = await productCollection.countDocuments({ category: "Womens" });
        const totalPages = Math.ceil(totalProducts / pageSize);
  
        res.render('user/Totalproductlisting', { products, currentPage: page, totalPages, category });
      } else {
        // Handle the case where no products are found
        res.render('user/Totalproductlisting', { products: [], currentPage: page, totalPages: 0, category: null });
      }
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
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
    console.log("inside the checkout page");
    const totalPrice = parseFloat(req.query.totalPrice);
    console.log("The total price:", totalPrice);
    const email = req.session.user;
    const user = await userCollection.findOne({ email: email });
    console.log("user in checkout:", user);

    if (!user) {
      return res.status(404).send('User not found or missing in the session.');
    }


    let cartFound = await cartCollection.findOne({ userId: user._id }).populate({
      path: 'products.productId',
      model: 'collectionOfProduct',
    });

    console.log("cartFound is:", cartFound);
    if (cartFound) {
      cartFound.total = totalPrice;
      cartFound.products = cartFound.products;

    } else {
      cartFound = new cartCollection({
        userId: user._id,
        total: totalPrice,
        products: [],
      });
    }
    await cartFound.save();

    const addresses = user?.address || [];

    res.render('user/checkout', { user, addresses, cartFound });
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }
};


// UserDetails function
const UserDetails = async (req, res) => {
  try {
    const userEmail = req.session.user;
    console.log("UserDetails", userEmail, req.body);
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
    console.log("Update result", updateResult);
    if (updateResult.matchedCount > 0) {
      // Successful update, redirect to the root path
      res.redirect('/');
    }
  } catch (error) {
    console.error("Error in UserDetails", error);
    res.status(500).send('Internal Server Error ');
  }
};




const profile = async (req, res) => {
  try {
    const store = req.session.user;
    console.log("Stored in profile");
    const user = await userCollection.findOne({ email: store }) || {};
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

const addAddressUserPage = async (req, res) => {
  // const isUser = req.session.user;
  res.render('user/addAddressUser', { noData: '' });
}


const NewAddressAddedForUser = async (req, res) => {
  try {

    const { street, country, city, state, zip } = req.body;

    if (!street || !country || !city || !state || !zip) {
      const noData = 'Please fill in all the fields.';
      return res.render('user/addAddressUser', { noData });
    }


    const newData = {
      street: req.body.street,
      country: req.body.country,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip
    };
    const userEmail = req.session.user
    console.log("userEmail", userEmail, req.session.user)

    const updatedUser = await userCollection.findOneAndUpdate(
      { email: userEmail },
      {
        $push: {
          'address': newData
        }
      },
      { new: true }
    );
    if (updatedUser) {
      return res.redirect('/home');

    } else {
      res.render('/home');
      console.log("update user", updatedUser)

      res.send("new addres for user error");
    }
  } catch (error) {
    console.log(error); // Log the entire error object
    res.send("Internal Server Error: " + error.message);
  }
};

// const addCheckoutAddress = async (req, res) => {
//   res.render("user/AddingCheckoutAddress");
// }

const addCheckoutAddressPost = async (req, res) => {
  try {


    const { street, country, city, state, zip } = req.body;

    if (!street || !country || !city || !state || !zip) {
      const noData = 'Please fill in all the fields.';
      return res.render('user/AddingCheckoutAddress', { noData });
    }

    const newData = {
      street: req.body.street,
      country: req.body.country,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip
    };
    const userEmail = req.session.user;
    console.log("userEmail", userEmail, req.session.user)

    const updatedUser = await userCollection.findOneAndUpdate(
      { email: userEmail },
      {
        $push: {
          'address': newData
        }
      },
      { new: true }
    );
    if (updatedUser) {
      return res.redirect('/checkout');

    } else {
      console.log("update user", updatedUser)

      res.send("new addres for user error");
    }
  } catch (error) {
    console.log(error); // Log the entire error object
    res.send(error.message);
  }
};

// --------forgott


module.exports = {
  login, loginpost, signout,
  signupPost, signup, home,
  sendOTPByEmail, back, productdetails,
  MensTotalproductlist, WomensTotalproductlist, checkout,
  UserDetails, profile,
  addAddressUserPage, NewAddressAddedForUser,
  addCheckoutAddressPost,

};
