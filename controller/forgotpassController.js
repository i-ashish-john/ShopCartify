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
      req.session.email = forgotEmail;

      console.log("entered email is:*",req.session.email);
      const fullData = await userCollection.findOne({ email: req.session.email });

      console.log("full data is:", fullData);
      let message = '';
      if (!fullData || fullData.email !== req.body.forgotEmail) {
      const  message = "This email does not exist.";
        res.render('user/OtpVerification', { message });
      } else {
        // Generate OTP and send it to the user
        const otp = await sendOTP( req.session.email);
        console.log("OTP in the  :", req.session.email,"is", otp);
  
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
        const otpTimestamp = req.session.otpTimestamp;
        // console.log("the otp stamp is :",otpTimestamp); 

        if (!storedOTP || !otpTimestamp) {
            res.render('user/forgotOtp', {otpExpirationTime:"" , currentTime:"", email: req.session.email, wrongOtp: 'Timeout please try again' });
            return;
        }

        const currentTime = new Date().getTime();
        const otpExpirationTime = otpTimestamp + 1 * 60 * 1000; 

        if (currentTime > otpExpirationTime) {
            // Check if the OTP has already been used (expired)
            if (req.session.usedOTP) {
                res.render('user/forgotOtp', { otpExpirationTime , currentTime,email: req.session.email, wrongOtp: 'OTP has expired. Please request a new OTP.' });
            } else {
                res.render('user/forgotOtp', { otpExpirationTime , currentTime, email: req.session.email, wrongOtp: 'OTP timeout. Please try again.' });
            }
            return;
        }

        if (otp === storedOTP) {
            // Mark the OTP as used
            req.session.usedOTP = true;

            res.render('user/updatePassword', { email: req.session.email, error: '' });
        } else {
            res.render('user/forgotOtp', { email: req.session.email, wrongOtp: 'Invalid OTP' });
        }
    } catch (error) {
        console.log("Error in OTP verification");
        console.log(error.message);
        res.send(error.message);
    }
};

  const updatePassword = async (req, res) => {
    try {
      // const { forgotEmail } = req.session.email;
        const {  newPassword, confirmPassword } = req.body;

        console.log("ForgotEmail is here :", req.session.email );
        console.log("Newpassword is here :", newPassword );
        console.log("confirmPassword is  here :", confirmPassword );

        if (newPassword !== confirmPassword) {
          return res.render('user/updatePassword',{confirmPassword , newPassword,error :'new password and the confirm password do not match'});
        }
        const user = await userCollection.find({ email:req.session.email });
            console.log("THE FOUNDED USER IN THE UPDATE PASSWORD IS :",user);
          
              const userPassword = user.password;
              console.log(" The user password in the update password is :!!!",user.password);
          if(userPassword === confirmPassword){  //Checking if the passwrod is already in use or not
            return res.render('user/updatePassword',{ error:'Try another strong password' });
          }



            if(confirmPassword === user.email){
              return res.render('user/updatePassword', {error:"try another password"}  )
            }

        const updatedUser = await userCollection.findOneAndUpdate(
            { email: req.session.email},
            { $set: { password: confirmPassword  } },
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

  
  

  module.exports = {
    forgotPasswordLoadPage,
    forgotPasswordLoadpagePost,
    verifyOtp,updatePassword
  };