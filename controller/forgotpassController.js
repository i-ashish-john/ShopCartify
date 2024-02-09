const userCollection = require('../model/userCollection');
const productCollection = require('../model/productCollection');
const cartCollection = require('../model/cartCollection');
const addressCollection = require('../model/addressCollection');
const orderCollection = require('../model/orderCollection');
const { log } = require('console');
const nodemailer = require('nodemailer');
const generateOtp = require('generate-otp');
const mongoose = require('mongoose');


const forgotPasswordLoadPage = async (req, res) => {
  try {
      res.render('user/OtpVerification', { message: " " });
  } catch (error) {
      console.log("error in the forgottpassword loadpage");
      console.log(error.message);
      res.send(error.message);
  }
};
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const sendOTP = async (email) => {
  const otp = generateOTP();
  console.log("THE OTP IS:", otp);

  const otpExpiresAt = new Date();
  // Set OTP expiration time to 1 minute from now
  otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 1);

  const transporter = nodemailer.createTransport({
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

  transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
          console.log(error);
      } else {
          console.log('Email sent: ' + info.response);
      }
  });


  return { otp, otpExpiresAt };
};


const forgotPasswordLoadpagePost = async (req, res) => {
  try {

    if (req.body.forgotEmail === ''|| req.body.forgotEmail.trim()==='') {
      const message = "Field cannot be empty";
    return  res.render('user/OtpVerification', { message });
   }
    const { forgotEmail } = req.body;
    req.session.email = forgotEmail;

    const { otp, otpExpiresAt } = await sendOTP(req.session.email);

    req.session.forgotPasswordOTP = otp;
    req.session.otpTimestamp = otpExpiresAt.getTime();

    res.render('user/forgotOtp', { validate: '', email: forgotEmail, wrongOtp: "", currentTime: "", otpExpirationTime: otpExpiresAt });
  } catch (error) {
    console.log("error in the forgottpassword loadpage");
    console.log(error.message);
    res.send(error.message);
  }
};
const verifyOtp = (req, res) => {
  try {
    const { otp } = req.body;
    const storedOTP = req.session.forgotPasswordOTP;
    const otpTimestamp = req.session.otpTimestamp;

    console.log(`Received OTP: ${otp}`);
    console.log(`Stored OTP: ${storedOTP}`);
    console.log(`OTP Timestamp: ${otpTimestamp}`);

    if (!storedOTP || !otpTimestamp) {
      return res.render('user/forgotOtp', { validate: '', otpExpirationTime: "", currentTime: "", email: req.session.email, wrongOtp: 'Timeout please try again' });
    }

    const currentTime = new Date().getTime();
    const otpExpirationTime = otpTimestamp +  1 *  60 *  1000;

    console.log(`Current Time: ${currentTime}`);
    console.log(`OTP Expiration Time: ${otpExpirationTime}`);

    if (currentTime > otpExpirationTime) {
      req.session.usedOTP = false;
      return res.render('user/forgotOtp', {
        validate: '',
        otpExpirationTime,
        currentTime,
        email: req.session.email,
        wrongOtp: '',
      });
    }

    if (!otp) {
      return res.render('user/forgotOtp', { currentTime: "", wrongOtp: '', validate: "Enter OTP to continue", otpExpirationTime });
    }

    if (otp === storedOTP) {
      req.session.usedOTP = true;
      res.render('user/updatePassword', { email: req.session.email, error: '' });
    } else {
      return res.render('user/forgotOtp', { currentTime: "", validate: '', email: req.session.email, wrongOtp: 'Invalid OTP', otpExpirationTime });
    }
  } catch (error) {
    console.log("Error in OTP verification");
    console.log(error.message);
    return res.send(error.message);
  }
};


const updatePassword = async (req, res) => {
  try {
      const { newPassword, confirmPassword } = req.body;

      if (newPassword !== confirmPassword) {
          return res.render('user/updatePassword',{confirmPassword , newPassword,error :'new password and the confirm password do not match'});
      }
      const user = await userCollection.find({ email:req.session.email });
      
      if(user[0].password === confirmPassword){ 
          return res.render('user/updatePassword',{ error:'Try another strong password' });
      }

      if(confirmPassword === user[0].email){
          return res.render('user/updatePassword', {error:"try another password"} )
      }

      const updatedUser = await userCollection.findOneAndUpdate(
          { email: req.session.email},
          { $set: { password: confirmPassword } },
          { new: true, useFindAndModify: false }
      ).catch(error => {
          console.error("Error in findOneAndUpdate:", error);
          return res.render('user/updatePassword', {  user,newPassword, error: 'An error occurred while updating the password.'});
      });

      console.log("here 2");
      console.log("updated user:", updatedUser);

      if (!updatedUser) {
          return res.render('user/updatePassword', {  user, newPassword, error: 'User not found.' });
      }

      console.log("here 3");

      delete req.session.forgotPasswordOTP;
      delete req.session.forgotEmail;
      const products = await productCollection.find();
      return res.render('user/home',{products });
  } catch (error) {
      console.log("Error in password update");
      console.log(error.message);
      return res.send(error.message);
  }
};


// const resend  = async(req,res)=> {
//   resemd
// } 

  
  

  module.exports = {
    forgotPasswordLoadPage,
    forgotPasswordLoadpagePost,
    verifyOtp,updatePassword
  };