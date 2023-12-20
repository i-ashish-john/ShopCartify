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
    // Generate a 6-digit random OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const sendOTP = async (email) => {
    const otp = generateOTP(); // Remove the declaration of 'otp' here
    const otpExpiresAt = new Date();
    const expirationMinutes = 5;
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + expirationMinutes);
  
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
    
    return otp; // Return the generated OTP
  };
  
  const forgotPasswordLoadpagePost = async (req,res)=> {
    try {
      const { forgotEmail } = req.body;
      console.log("entered email is:", forgotEmail);
      const fullData = await userCollection.findOne({ email: forgotEmail });
      console.log("full data is:", fullData);
      let message = '';
      if (!fullData || fullData.email !== forgotEmail) {
        message = "This email does not exist.";
        res.render('user/OtpVerification', { message });
      } else {
        // Generate OTP and send it to the user
        const otp = await sendOTP(forgotEmail);
        console.log("OTP IS :", otp);
  
        // Store the generated OTP in session or database for later verification
        // For simplicity, storing it in memory (replace this with your database logic)
        req.session.forgotPasswordOTP = otp;
        console.log("* session otp is :",req.session.forgotPasswordOTP);
  
        res.render('user/forgotOtp', { email: forgotEmail, wrongOtp: "" });
      }
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
      console.log(" *stored otp is:", storedOTP);
      if (otp === storedOTP) {
        // Correct OTP, render the password updating template
        res.render('user/updatePassword', { email: req.session.forgotEmail,error :''});
      } else {
        // Incorrect OTP, show an error message
        res.render('user/forgotOtp', { email: req.session.forgotEmail, wrongOtp: 'Invalid OTP' });
      }
    } catch (error) {
      console.log("Error in OTP verification");
      console.log(error.message);
      res.send(error.message);
    }
  };
  

  const updatePassword = async (req, res) => {
    try {
      const { forgotEmail } = req.body;
        const {  newPassword, confirmPassword } = req.body;

        console.log("Request Body:", req.body);
        console.log("new user is here :", newPassword);
        console.log("forgotEmail is :",forgotEmail);

        if (newPassword !== confirmPassword) {
            return res.render('user/updatePassword', { forgotEmail, newPassword, error: "New password and confirm password do not match." });
        }

        const user = await userCollection.find( {email:forgotEmail} );
        console.log("THE  USEr iS :",user);
  
        if(confirmPassword === user.email){
          return res.render('user/updatePassword', {  error: "Try another password" });
        }

        const updatedUser = await userCollection.findOneAndUpdate(
            { forgotEmail: forgotEmail },
            { $set: { password: newPassword } },
            { new: true, useFindAndModify: false }
        ).catch(error => {
            console.error("Error in findOneAndUpdate:", error);
            return res.render('user/updatePassword', { forgotEmail, newPassword, error: "An error occurred while updating the password." });
        });

        console.log("here 2");
        console.log("updated user:", updatedUser);

        if (!updatedUser) {
            return res.render('user/updatePassword', { forgotEmail, newPassword, error: "User not found." });
        }

        console.log("here 3");

        delete req.session.forgotPasswordOTP;
        delete req.session.forgotEmail;

        return res.render('user/home');
    } catch (error) {
        console.log("Error in password update");
        console.log(error.message);
        return res.send(error.message);
    }
};

  
  

  module.exports = {
    forgotPasswordLoadPage,
    forgotPasswordLoadpagePost,
    verifyOtp,updatePassword
  };