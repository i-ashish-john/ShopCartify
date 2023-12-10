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
const mongoose = require('mongoose');

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
    console.log(error.message);
    res.send(error.message);
  }
};


const cartload = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user;
      const userData = await userCollection.findOne({ email: userId });
      const cartDocument = await cartCollection.find({ userId: userData._id })
        .populate({
          path: 'products.productId',
          model: 'collectionOfProduct'
        });
      // Add this line for debugging
      if (!cartDocument || cartDocument.length === 0) {
        res.render('user/cart', { userData, cartDocument, message: 'No items in cart' });
      } else {
        res.render('user/cart', { userData, cartDocument });
      }
    } else {
      res.status(401).send('You must be logged in to view your cart');
    }
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }
};


const addToCart = async (req, res) => {
  try {
    const productId = req.query.id;
    const users = req.session.user;

    if (!users) {
      return res.status(401).send('Unauthorized. Log in to continue.');
    }
    const productDocument = await productCollection.findById(productId);
    const user = await userCollection.findOne({ email: users });
    if (!productDocument || !user) {
      return res.status(404).send('Product or user not found.');
    }

    // Find the user's cart
    let cart = await cartCollection.findOne({ userId: user._id });

    if (cart) {
      // Check if the product is already in the cart
      const existingProduct = cart.products.find((p) => p.productId.equals(productDocument._id));

      if (existingProduct) {
        // If the product is already in the cart, update the quantity
        await cartCollection.findOneAndUpdate(
          { userId: user._id, 'products.productId': productDocument._id },
          { $inc: { 'products.$.quantity': 1 } }
        );
      } else {
        // If the product is not in the cart, add it
        const price = productDocument.price;
        cart.products.push({
          productId: productDocument._id,
          price: price,
          images: [productDocument.Images[0]],
          quantity: 1,
        });
      }
    } else {
      // If the user doesn't have a cart yet, create a new one
      const price = productDocument.price;

      const cartData = {
        userId: user._id,
        products: [{
          productId: productDocument._id,
          price: price,
          images: [productDocument.Images[0]],
          quantity: 1,
        }],
      };
      cart = await cartCollection.create(cartData);
    }

    // Recalculate and update the total in the cart
    cart.calculateTotal();

    await cart.save();

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
    console.log("data is :", data);
    console.log("THE PARAM ID IS :", req.query.id);
    req.session.product = data;
    console.log("id of the product: " + req.session.product);
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

const Totalproductlist = async (req, res) => {

  const user = await userCollection.find();
  const products = await productCollection.find();
  res.render('user/Totalproductlisting', { user, products });
};


const cartItemRemove = async (req, res) => {
  try {
    const productId = req.params.id; // get productId from the route
    const cartId = req.body.cartId; // get cartId from the form
    // console.log("THE CART ID IS:", cartId);
    // console.log('Product Id:', productId);

    // Delete the product from the specific cart
    const updatedCart = await cartCollection.findOneAndUpdate({ _id: cartId }, { $pull: { products: { productId: productId } } }, { new: true });

    if (updatedCart) {
      // console.log("Updated Cart:", updatedCart);
      res.redirect('/cartload');
    } else {
      // Handle error case
      console.log('Product not found in the cart');
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
console.log("totalprice",totalPrice);
    res.json({ message: 'Request handled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const incCart = async (req, res) => {
  try {
    const pid = req.params.id;
    const cart = await cartCollection.findOne({ "products.productId": pid });

    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    const productIndex = cart.products.findIndex(p => p.productId.toString() === pid);

    // Increment the quantity of the specific product
    cart.products[productIndex].quantity++;

    // Recalculate total or perform any other necessary updates
    cart.total += cart.products[productIndex].price;

    await cart.save();

    res.send({
      success: true,
      newQuantity: cart.products[productIndex].quantity,
      newPrice: cart.products[productIndex].price,
      oldPrice: cart.products[productIndex].price,
      totalPrice: cart.total,
      pid: pid
    });
  } catch (error) {
    console.error(error);
    res.send(error.message);
  }
};

const decCart = async (req, res) => {
  try {
    const pid = req.params.id;
    const cart = await cartCollection.findOne({ "products.productId": pid });

    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    const productIndex = cart.products.findIndex(p => p.productId.toString() === pid);

    // Decrement the quantity of the specific product
    cart.products[productIndex].quantity--;

    // Recalculate total or perform any other necessary updates
    cart.total -= cart.products[productIndex].price;

    await cart.save();

    res.send({
      success: true,
      newQuantity: cart.products[productIndex].quantity,
      newPrice: cart.products[productIndex].price,
      oldPrice: cart.products[productIndex].price,
      totalPrice: cart.total,
      pid: pid
    });
  } catch (error) {
    console.error(error);
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

const addCheckoutAddress = async (req, res) => {
  res.render("user/AddingCheckoutAddress");
}

const addCheckoutAddressPost = async (req, res) => {
  try {
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

const checkoutPost = async (req, res) => {
  try {
    console.log("THE DATA 1 IS IN THE CHECKOUT POST");
    const { username, email, paymentType, selectedAddressId, totalPrice } = req.body;
    console.log("body of checkout page is :", username, email, paymentType, selectedAddressId);
    console.log("the body values:", req.body);

    const userId = req.session.user;
    console.log("logged user in the user is:", userId);

    const emailOfUser = await userCollection.findOne({ email: userId });
    const cartData = await cartCollection.findOne({ userId: emailOfUser._id });
    console.log("cartData:", cartData);

    if (!cartData) {
      return res.status(404).json({ message: 'Cart values not found' });
    }
    const selectedAddress = emailOfUser.address.find(address => address._id == selectedAddressId);
      console.log("The  emailOfUser is :",emailOfUser);

      const productDetailsPromises = cartData.products.map(async product => {
        const productDetails = await productCollection.findById(product.productId);
        console.log("the product details is:",productDetails);
        return productDetails;
      });
  
      const productDetailsArray = await Promise.all(productDetailsPromises);


    const order = new orderCollection({
      username,
      email,
      paymentType,
      totalPrice,
      productdetails: productDetailsArray.map(productDetails => productDetails._id),
      address: {
        street: selectedAddress?.street,
        city: selectedAddress?.city,
        state: selectedAddress?.state,
        zip: selectedAddress?.zip,
        country: selectedAddress?.country,
      }
    });
    console.log("the order  is :",order);
    console.log("the productdetails is:",productdetails);
    console.log("the selectedAddress is :",selectedAddress);

    await order.save();

    await cartCollection.deleteOne({ userId: emailOfUser._id });


    if (order.paymentType === 'CashOnDelivery') {
      return res.render('user/ordersuccess');
    }

    res.status(201).json({ message: 'Order saved successfully' });
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }
};



module.exports = {
  login, loginpost, signout,
  signupPost, signup, home, cartload,
  sendOTPByEmail, back, productdetails,
  Totalproductlist, cartItemRemove, addToCart,
  updateCartItem, incCart, decCart, checkout,
  submitAddress, orderStatus, UserDetails, profile,
  addAddressUserPage, NewAddressAddedForUser, addCheckoutAddress, addCheckoutAddressPost,checkoutPost
};
