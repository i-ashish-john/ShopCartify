const cartCollection = require('../model/cartCollection');
const userCollection = require('../model/userCollection');
const orderCollection = require('../model/orderCollection');
const productCollection = require('../model/productCollection');
const addressCollection = require('../model/addressCollection');
const returnCollection = require('../model/returnCollection');
const categoryCollection = require('../model/categoryCollection');
const walletCollection = require('../model/walletCollection');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const { stringify } = require('querystring');

let instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

const submitAddress = async (req, res) => {
  try {

    console.log("ENTERED IN SUBMIT");
    const formData = req.body;
    console.log("REQ.BODY", req.body);

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

    const newOrder = new orderCollection({
      addressId: savedAddress._id,
      totalPrice: totalPrice,
    });

    const savedOrder = await newOrder.save();

    res.render('user/ordersuccess', {
      order: savedOrder,
      // this is the space for adding other variables
    });
  } catch (error) {
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

const checkoutPost = async (req, res) => {
  try {
    const variable = {
      username: req.body.username,
      email: req.body.email,
      paymentType: req.body.paymentType,
      selectedAddressId: req.body.selectedAddressId,
      totalPrice: req.body.totalPrice,
    };
    const userId = req.session.user;
    const emailOfUser = await userCollection.findOne({ email: userId });
    const cartData = await cartCollection.findOne({ userId: emailOfUser._id });
 
    if (!cartData) {
      return res.status(404).json({ message: 'Cart values not found' });
    }
 
    const selectedAddress = emailOfUser.address.find(address => address._id == variable.selectedAddressId);
 
    const productDetailsPromises = cartData.products.map(async product => {
      const productDetails = await productCollection.findById(product.productId);
 
      if (productDetails) {
        const newStock = productDetails.stock - product.quantity;
        
        if (newStock < 0) {
          console.log("Insufficient stock for product: ", productDetails.name);
          return null;
        }
 
        await productCollection.findByIdAndUpdate(product.productId, { stock: newStock });
      }

      return productDetails;
    });
 
    const productDetailsArray = (await Promise.all(productDetailsPromises)).filter(detail => detail !== null);
 
    const order = new orderCollection({
      username: variable.username,
      email: variable.email,
      paymentType: variable.paymentType,
      totalPrice: variable.totalPrice,
      productdetails: productDetailsArray.map(productDetails => productDetails._id),
      address: {
        street: selectedAddress?.street,
        city: selectedAddress?.city,
        state: selectedAddress?.state,
        zip: selectedAddress?.zip,
        country: selectedAddress?.country,
      }
    });

   console.log("F_U_L_L D_A_T_A",order.username,"|",order.email,"|",order.paymentType,"|",order.totalPrice,"|",order.productdetails,"|",order?.address);
    await order.save();
    await cartCollection.deleteOne({ userId: emailOfUser._id });
 
    if (order.paymentType === 'CashOnDelivery' || order.paymentType === 'Wallet') {
      return res.render('user/ordersuccess');
    }
 
    if (order.paymentType === 'NetBanking') {
      // NetBanking payment logic here
      return res.render('user/ordersuccess');

    }
 
    // res.status(201).json({ message: 'Order saved successfully' });
  } catch (error) {
    console.error(error);
    res.send(error);
  }
 };
 

const orderList = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userCollection.findOne({ email: email });
    console.log("The user details is:", user);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const orders = await orderCollection
      .find({ email: user.email })
      .populate('productdetails')
      .exec();
    console.log("hello ^^^", user._id);
    res.render("user/orderList", { orders });
    console.log("OrDeRs details is:", orders);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
};


// const orderList = async (req, res) => {
//   try {
//     const user = req.session.user;
//     const userIdObject = await userCollection.findOne({ email: user }); 
//     if (!userIdObject) {
//       throw new Error("Userin  not found");
//     }
//     const userId = userIdObject._id; 

//     console.log("The user ID in the orderlist is:", userId);

//     const orders = await orderCollection
//       .find({ userId: userId }) 
//       .populate('productdetails')
//       .exec();

//     res.render('user/orderList', { user, orders }); 

//   }catch(error){
//     console.log(error.message);
//     res.send(error.message);
//   }
// };
const addCheckoutAddress = async (req, res) => {
  res.render("user/AddingCheckoutAddress");
};


const SingleOrderlist = async (req, res) => {
  try {

    const orderId = req.params.id;
    const email = req.session.user;
    const userDetails = await userCollection.findOne({ email: email });
    // Fetch order details with product details populated
    const returStatus = await returnCollection.find({ userId: userDetails.id });
    const specificReturnStatus = await returnCollection.findOne({ orderId: orderId });
    //  const StatusOfThespecificReturnStatus = specificReturnStatus.status;
    console.log("About the status :", specificReturnStatus?.status);
    const orderDetails = await orderCollection
      .findOne({ _id: orderId })
      .populate({
        path: 'productdetails',
        model: 'collectionOfProduct',
      });

    console.log(" the order details inside the :", orderDetails);
    if (!orderDetails) {
      // If the order with the specified orderId doesn't exist
      return res.status(404).send('Order not found');
    }

    const productsWithImages = [];

    for (const productId of orderDetails.productdetails) {
      // Ensure that the productDetails is not null
      const productDetails = await productCollection.findById(productId);

      if (productDetails) {
        productsWithImages.push({
          name: productDetails.name,
          description: productDetails.description,
          quantity: 1, // You can modify this based on your data structure
          price: `${productDetails.price}`,
          images: productDetails.Images,
        });
      } else {
        console.warn(`Product not found for productId: ${productId}`);
        // Handle the case where a product is not found (optional)
      }
    }
    // console.log("the specialReturn status is :",specificReturnStatus.status);
    res.render('user/singleOrder', { orderDetails, productsWithImages, specificReturnStatus });
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const email = req.session.user;
    const updatedOrder = await orderCollection.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: 'Cancelled' } },
      { new: true }
    );

    console.log("The updated order in the cancel order is:", updatedOrder);

    if (updatedOrder) {
      // Fetch all orders again after the update
      const orders = await orderCollection.find({ email: email });

      res.render("user/orderList", { orders });
    } else {
      console.log("Error in canceling order");
      res.status(404).json({ error: 'Order not found or error in canceling order' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
};

const ReturnTotalProduct = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log("the return total product", orderId);
    const email = req.session.user;
    const userData = await userCollection.findOne({ email: email });
    console.log("The user is here:", userData);
    const orderDetails = await orderCollection.findById(orderId).populate('productdetails');

    if (!orderDetails) {
      return res.status(404).send("Order not found");
    }

    const totalPrice = orderDetails.totalPrice;

    const returnOrNot = new returnCollection({
      productId: orderDetails.productdetails[0],
      userId: userData._id,
      orderId: orderId,
      amount: totalPrice,
      status: 'Return Requested',
    });

    await returnOrNot.save();
    // res.render('user/Totalproductlisting');
    res.redirect('/ListOfOrders');
    // res.send("Return saved successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};
      
const walletLoad = async (req, res) => {
  try {
    //this function is for displaying the wallet's total amount in the wallet template
    const email = req.session.user;
    const userDoc = await userCollection.findOne({ email: email });
    const walletData = await walletCollection.find({ userId: userDoc._id });

    const totalAmount = walletData.reduce((acc, wallet) => acc + wallet.totalAmount, 0);
    await walletCollection.updateOne(
      { userId: userDoc._id },
      { $set: { amounts: [totalAmount] } }
    );

    res.render('user/wallet', { total: totalAmount });
  } catch (error) {
    res.send(error.message);
  }
};

const walletPay = async (req, res) => {
  try {
    console.log("entered in to the walletPay post");
    const user = req.session.user;
    const userFullData = await userCollection.findOne({ email: user });
    const totalPrice = req.body.totalPrice;
    console.log("userFulldata",userFullData._id);

    let walletBalance = await walletCollection.find({ userId: userFullData._id });
    console.log("walletBalance is :",walletBalance);
    console.log("wallet's amounts is :",walletBalance[0].amounts);
    if (walletBalance && walletBalance[0].amounts && walletBalance[0].amounts.length > 0) {
      const totalAmount = walletBalance[0].amounts.reduce((acc, amount) => acc + amount, 0);
      console.log("totalAmount is :",totalAmount);
      console.log("totalprice is :",totalPrice);

      if (totalAmount > totalPrice) {
        console.log("entered in to the success case");
        const newAmounts = walletBalance[0].amounts.map(amount => amount - totalPrice);

        await walletCollection.updateOne(
          { userId: userFullData._id },
          { $set: { amounts: newAmounts } } // Corrected this line
        );

        res.json({ success: true });
      } else {
        res.json({ error: 'Insufficient wallet balance' });
      }
    } else {
      res.json({ error: 'No wallet balance found for the user' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const payPost = async (req, res) => {                       

  try {
    console.log('paypost');
    const razorpayOrder = await instance.orders.create({
      amount: req.body.totalPrice,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    });
    console.log('razorpay log:', razorpayOrder);
    return res.json(razorpayOrder).send()
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }

};

module.exports = {
  submitAddress, orderStatus,
  addCheckoutAddress,
  checkoutPost, orderList, SingleOrderlist,
  cancelOrder,
  payPost,
  ReturnTotalProduct,
  walletLoad,
  walletPay


};