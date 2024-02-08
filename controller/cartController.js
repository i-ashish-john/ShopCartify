const cartCollection = require('../model/cartCollection');
const userCollection = require('../model/userCollection');
const orderCollection = require('../model/orderCollection');
const productCollection = require('../model/productCollection');
const addressCollection = require('../model/addressCollection');
const categoryCollection = require('../model/categoryCollection');
// const flash = require('express-flash');

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
      const { action, productId } = req.body;//discount price also need to take here 
    
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
  console.log("totalpria;=ce",totalPrice);
      res.json({ message: 'Request handled' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  
  const incCart = async (req, res) => {
    try {
      console.log("entered incart");
      const pid = req.params.id;
      console.log("cart's pid",pid);
      const cart = await cartCollection.findOne({ "products.productId": pid });
      const products=await productCollection.findById(pid)
      console.log("products",products);
      if (!cart) {
        return res.status(404).send('Cart not found');
      }
  
      const productIndex = cart.products.findIndex(p => p.productId.equals(pid));
      console.log('product index:', productIndex);
      console.log('product id:', pid);
      console.log('product cart', cart.products);
  
      cart.products[productIndex].quantity++;
  
      if (products.stock <= cart.products[productIndex].quantity) {
        return res.status(401).send({ message: "Out of stock" });
      }
  
      const discountPrice = cart.products[productIndex].discount_price;
      console.log("discount in he spec crt:",discountPrice);

      cart.total += discountPrice;
      console.log("total Is Here:", cart.total);
      await cart.save();

      res.send({
        success: true,
        newQuantity: cart.products[productIndex].quantity,
        newPrice: cart.products[productIndex].price,
        oldPrice: cart.products[productIndex].price,
        totalPrice: cart.total,
        discountPrice:discountPrice,
        pid: pid
      });
    } 
     catch (error) {
    console.error(error.stack);
    res.send(error.stack);
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
        stock:cart.products[productIndex].stock,
        pid: pid
      });
    } catch (error) {
      console.error(error);
      res.send(error.message);
    }
  };
  //add to cart is here//
  const addToCart = async (req, res) => {
    try {
      const productId = req.query.id;
      const users = req.session.user;
     console.log("product's id is:",productId);
     console.log("user's id is:",users);

      if (!users) {
        return res.status(401).send('Unauthorized. Log in to continue.');
      }
      const products = await productCollection.findById(productId);
      console.log("product document is :",products);
      const user = await userCollection.findOne({ email: users });
      console.log("user is :",user);
      if (!products || !user) {
        console.log(errirrrr);
        return res.status(404).send('Product or user not found.');
      }
      const cart = await cartCollection.findOne({ userId: user._id });
      
      if (cart) {
        const existingProduct = cart.products.find((p) => p.productId.equals(products._id));
        if (existingProduct) {
          console.log("existing product is :",existingProduct);
          const newQuantity = existingProduct.quantity+1;

          if (newQuantity > products.stock) {
              req.flash('error', 'Stock limit exceeded.'); 
              return res.status(404).send("Limit exceeds");
            }
          // await cartCollection.findOneAndUpdate(
          //   { userId: user._id, 'products.productId': products._id },
          //   { $set: { 'products.$.quantity': newQuantity } }
          // );
          let update=await cartCollection.findOneAndUpdate(
            { userId: user._id, 'products.productId': products._id },
            { 
              $set: { 
                'products.$.quantity': newQuantity,
                'products.$.discount_price': products.price * newQuantity * (1 - products.Discount / 100)
              }
            }
          );
          console.log(update)
          
        } else {
          const price = products.price;
          const originalPrice = products.price; // Assuming products is an object with a price property
          const discountPercentage = products.Discount;
          const discount = discountPercentage / 100;
  
          cart.products.push({
            productId: products._id,
            price: price,
            discount_price:originalPrice - (originalPrice * discount),
            images: [products.Images[0]],
            quantity: 1,
          });
        }

      } else {
        const price = products.price;
        if(products.Discount && products.Discount > 0){
          // price = products.Discoun
          price = products[i].price - (products[i].price * (products[i].Discount / 100));
          console.log("@@@@###$$$$_+_+_the cart added new price is :",price);
        }

        const tempStock = products.stock - 1;
        const originalPrice = products.price; // Assuming products is an object with a price property
          const discountPercentage = products.Discount;
          const discount = discountPercentage / 100;
 
        const cartData = {
          userId: user._id,
          products: [{
            productId: products._id,
            price: price,
            discount_price:originalPrice - (originalPrice * discount),
            images: [products.Images[0]],
            quantity: 1,
            tempStock: tempStock,
          }],
        };
        const cart = await cartCollection.create(cartData);
      }
  
      cart.calculateTotal();
      await cart.save();
  
      // res.redirect('/Totallistpro');
      res.status(200).send('success')
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