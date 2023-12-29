const cartCollection = require('../model/cartCollection');
const userCollection = require('../model/userCollection');
const orderCollection = require('../model/orderCollection');
const productCollection = require('../model/productCollection');
const addressCollection = require('../model/addressCollection');
const categoryCollection = require('../model/categoryCollection');
const mongoose = require('mongoose');



const cartItemRemove = async (req, res) => {
  try {
    const productId = req.params.id; // get productId from the route
    const cartId = req.body.cartId; // get cartId from the form
  

    console.log('Removing product:', productId, 'from cart:', cartId);

    // Update the cart to remove the specific product
    const updatedCart = await cartCollection.findOneAndUpdate(
      { _id: cartId },
      { $pull: { products: { productId: new mongoose.Types.ObjectId(productId) } } },
      { new: true }
    );

    if (updatedCart) {
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

    //  if (productId.stock < 0){
    //   res.render('')
    //  }

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

  module.exports = {
    cartload, cartItemRemove, addToCart,
    updateCartItem, incCart, decCart
  };