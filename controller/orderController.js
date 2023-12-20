const cartCollection = require('../model/cartCollection');
const userCollection = require('../model/userCollection');
const orderCollection = require('../model/orderCollection');
const productCollection = require('../model/productCollection');
const addressCollection = require('../model/addressCollection');
const categoryCollection = require('../model/categoryCollection');
const mongoose = require('mongoose');

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
      // console.log("the productdetails is:",productdetails);
      console.log("the selectedAddress is :",selectedAddress);
  
      await order.save();
  
      await cartCollection.deleteOne({ userId: emailOfUser._id });
  
  
      if (order.paymentType === 'CashOnDelivery') {
        return res.render('user/ordersuccess');
      }else if(order.paymentType === 'NetBanking'){
          return res.send('RAZORPAY NEXT WEEK TASK');
      }
  
      res.status(201).json({ message: 'Order saved successfully' });
    } catch (error) {
      console.error(error.message);
      res.send(error.message);
    }
  };
  const orderList = async(req,res)=>{
      try{
        const email = req.session.user;
        const orders = await orderCollection.find({email:email}).populate('productdetails');
        res.render("user/orderList", { orders });
      }catch(error){
        console.log(error.message);
        res.send(error.message)
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
       console.log(" the order in the single order list function is here :",orderId);
      // Fetch order details with product details populated
      const orderDetails = await orderCollection
      .findOne({ _id: orderId })
      .populate({
        path: 'productdetails',
        model: 'collectionOfProduct',
      });
        console.log(" the order details inside the :",orderDetails);
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
  
      res.render('user/singleOrder', { orderDetails, productsWithImages });
    } catch (error) {
      console.error(error.message);
      res.status(500).send(error.message);
    }
  };

  const cancelOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
  
      const updatedOrder = await orderCollection.findOneAndUpdate(
        { _id: orderId },
        { $set: { orderStatus: 'Cancelled' } },
        { new: true }
      );
  
      console.log("The updated order in the cancel order is:", updatedOrder);
  
      if (updatedOrder) {
        // Fetch all orders again after the update
        const allOrders = await orderCollection.find();
        
        res.render("user/orderList", { orders: allOrders });
      } else {
        console.log("Error in canceling order");
        res.status(404).json({ error: 'Order not found or error in canceling order' });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send(error.message);
    }
  };

module.exports = {
    submitAddress, orderStatus,
     addCheckoutAddress,
    checkoutPost,orderList,SingleOrderlist,
    cancelOrder
};