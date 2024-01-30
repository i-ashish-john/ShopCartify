const cartCollection = require('../model/cartCollection');
const userCollection = require('../model/userCollection');
const orderCollection = require('../model/orderCollection');
const productCollection = require('../model/productCollection');
const addressCollection = require('../model/addressCollection');
const returnCollection = require('../model/returnCollection');
const categoryCollection = require('../model/categoryCollection');
const walletCollection = require('../model/walletCollection');
const couponCollection = require('../model/couponCollection');
const easyinvoice = require('easyinvoice');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const { stringify } = require('querystring');
const { error } = require('console');

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

const orderList = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userCollection.findOne({ email: email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = 6; 

    const orders = await orderCollection
      .find({ email: user.email })
      .populate('productdetails')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    const totalOrders = await orderCollection.countDocuments({ email: user.email });

    res.render("user/orderList", { orders, currentPage: page, totalPages: Math.ceil(totalOrders / pageSize) });
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
};



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
    const email = req.session.user;
    const userDoc = await userCollection.findOne({ email: email });
    const walletData = await walletCollection.findOne({ userId: userDoc._id });

    // Pagination logic
    const page = req.query.page || 1; // Default to page 1
    const itemsPerPage = 10; // Choose the number of items per page

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;

    const totalAmounts = walletData.amounts.slice(startIndex, endIndex);

    res.render('user/wallet', { total: walletData.amounts[0], walletData: walletData, totalAmounts, currentPage: page });
  } catch (error) {
    res.send(error.message);
  }
};


const walletPay = async (req, res) => {
  try {
    console.log("entered into the walletPay post");
    const user = req.session.user;
    const userFullData = await userCollection.findOne({ email: user });
    const totalPrice = req.body.totalPrice;
    console.log("userFullData", userFullData._id);

    let walletBalance = await walletCollection.findOne({ userId: userFullData._id });
    console.log("walletBalance is:", walletBalance);
    console.log("wallet's amounts are:", walletBalance.amounts);
    
    if (walletBalance && walletBalance.amounts && walletBalance.amounts.length > 0) {
      const totalAmount = walletBalance.amounts.reduce((acc, amount) => acc + amount, 0);
      console.log("totalAmount is:", totalAmount);
      console.log("totalPrice is:", totalPrice);

      if (totalAmount >= totalPrice) {
        console.log("entered into the success case");
        const newAmounts = walletBalance.amounts.map(amount => amount - totalPrice);
        const debitAmount = totalAmount - newAmounts.reduce((acc, amount) => acc + amount, 0);
        walletBalance.debitAmounts.push(debitAmount);

        await walletCollection.updateOne(
          { userId: userFullData._id },
          { $set: { amounts: newAmounts, debitAmounts: walletBalance.debitAmounts } }
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
    console.log('paypost',req.body.totalPrice);
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

const checkoutPost = async (req, res) => {
  try {
    const variable = {
      username: req.body.username,
      email: req.body.email,
      paymentType: req.body.paymentType,
      selectedAddressId: req.body.selectedAddressId,
      totalPrice: req.body.totalPrice,
      couponCode:req.body.couponCode
    }
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
      },                   
    });
    console.log("F_U_L_L D_A_T_A",order.username,"|",order.email,"|",order.paymentType,"|",order.totalPrice,"|",order.productdetails,"|",order?.address);
    await order.save();
    await cartCollection.deleteOne({ userId: emailOfUser._id });
    if (order.paymentType === 'CashOnDelivery' || order.paymentType === 'Wallet') {
      return res.render('user/ordersuccess');
    }
    if (order.paymentType === 'NetBanking') {
      return res.render('user/ordersuccess');
    }
    // res.status(201).json({ message: 'Order saved successfully' });
    res.render('user/ordersuccess');
  } catch (error) {
    console.error(error);
    res.send(error);
  }
 };
 
 const couponChecking = async(req, res) => {
  try {
   
    console.log("came here couponchecking");
    const coupons = await couponCollection.find();
    const email = req.session.user;
    const variable = {
      couponCode:req.body.couponCode,
      totalPrice:req.body.totalPrice
    };
 
    const user = await userCollection.findOne({ email: email });
    if (!user) {
      return res.status(404).send('User not found or missing in the session.');
    };
 
    const redeemedArrayChecking = user.redeemedCoupons.map(c => c.couponCode);
    let UsedMessage;
 
    const couponCheck = await couponCollection.findOne({ couponCode: variable.couponCode });
    if(variable.couponCode){
      if(!couponCheck){
        UsedMessage = 'this coupon does not exist';
      } else if(redeemedArrayChecking.includes(variable.couponCode)){
        UsedMessage = 'This coupon is used ';
      }else if (!couponCheck ){
        UsedMessage = 'Nothing Found';
      }else if ( variable.totalPrice < couponCheck.minimumPurchaseValue ) {
        UsedMessage = 'Need more more purchase value';
      } else {
        UsedMessage = 'Coupon applied successfully';
        await userCollection.updateOne(//adding coupon to the redeemed array
          { email: email },
          { $push: { redeemedCoupons: { couponCode: variable.couponCode, redeemedAt: new Date() } } }
        );
      }
    }
    console.log("the vaiable amount is :",variable.totalPrice,variable.couponCode);
    let order = {};

    if(UsedMessage === 'Coupon applied successfully'){
      order.appliedCoupon = variable.couponCode;
      order.totalAmount = variable.totalPrice - (variable.totalPrice * (couponCheck.productDiscount / 100));
      console.log("The details is here :",order.totalAmount);
    }

    res.send({ success: true, message: UsedMessage, newTotalPrice: order.totalAmount });
  } catch (error) {
    res.send({ success: false, message: error.message });
  }
};
const downloadInvoice = async (req, res) => {
  try {
     console.log("inside of the downloadInvoice");
     const orderId = req.params.orderId;
     console.log("the orderID is here:",orderId);
     if (!mongoose.Types.ObjectId.isValid(orderId)) {
       return res.status(400).send("Not a valid objectId");
     }
 
     const orderData = await orderCollection. findById(orderId).populate('productdetails');
     if (!orderData) {
       return res.status(404).send("Order not found.");
     }
 
     const userData = await userCollection.findOne({ email: req.session.user });
     console.log("userdata is :",userData);
     const userId = userData._id;
     console.log("userId is ",userId);
     let addressDetails = {};
     if(userData && userData.address){
       addressDetails = userData.address[0];
       console.log("the addressDetails is :",addressDetails);
     } else {
       console.log("No address found for this user");
     }
 
     const orderProducts = await productCollection.find({ _id: { $in: orderData.productdetails } });
     console.log("orderProducts is :",orderProducts);
     res.json({ orderData, orderProducts, userData, addressDetails });
  } catch (error) {
     console.error("Error in downloadInvoice:", error);
     res.status(500).send("Internal Server Error");
  }
 };
 
 
module.exports = {
  submitAddress, orderStatus,
  addCheckoutAddress,
  checkoutPost, 
  orderList,
   SingleOrderlist,
  cancelOrder,
  payPost,
  ReturnTotalProduct,
  walletLoad,
  walletPay,
  downloadInvoice,
  //coupon Managing
couponChecking

};