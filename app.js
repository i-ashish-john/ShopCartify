const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const ejs = require('ejs');
const nocache = require('nocache');
const bodyParser = require('body-parser');
const compression = require('compression');
const slowDown = require("express-slow-down");

const userCollection = require('./model/userCollection');
const adminCollection = require('./model/adminCollection');
const productCollection = require('./model/productCollection');
const CategoryCollection = require('./model/categoryCollection');
const cartCollection = require('./model/cartCollection');
const orderCollection = require('./model/orderCollection');

const usersRouter = require('./routes/user');
const indexRouter = require('./routes/admin');

const app = express();
const port = 3001;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

app.use(nocache());

app.use(session({
 secret: 'your_secret_key',
 resave: false,
 saveUninitialized: true
}));

app.use(express.json());
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));


app.use(compression());

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 1000 // begin adding 1000ms of delay per request above 50:
 });
app.use(speedLimiter); 

app.use('/', usersRouter);
app.use('/admin', indexRouter);

app.use((req, res) => {
 res.render('user/404');
});

app.listen(port, () => {
 console.log("server started");
});
