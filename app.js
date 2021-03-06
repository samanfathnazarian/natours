//EXPRESS CODE RUNS IN THIS PAGE, ONLY HAS MIDDLEWARES
const path = require('path'); //core module
const express = require('express');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();
const morgan = require('morgan');
const tourRouter = require('./routs/tourRoutes');
const userRouter = require('./routs/userRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
var cookieParser = require('cookie-parser');
const reviewRouter = require('./routs/reviewRoutes');
const viewRouter = require('./routs/viewRoutes');

app.set('view engine', 'pug'); //defining template engine
app.set('views', path.join(__dirname, 'views')); //we don't know if given path will have a '/' or notwe don't know if given path will have a '/' or not

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(`${__dirname}/public`));

// Set Security HTTP headers
app.use(helmet());

// console.log(process.env.NODE_ENV);
// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //100 requests per hour (in ms)
  message: 'Too many requests from this IP, please try again in an hour!'
});

// Limit requests from same API
app.use('/api', limiter); // effects routes starts with api

/* 
middleware, is a function that modifies the incoming request data,
middleware is a step the requests go through. data from the 'body' is added to the request object
 */
// Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //body must be under 10kb

//parsers data from cookie
app.use(cookieParser());
// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); //needs to be after express.json

// Date sanitization against XSS (malicious scripts)
app.use(xss());

// Prevent parameter pollition
// duplicates in query string, become array
app.use(
  hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
  })
); //removes the array in req.query

/* 
app.use((req, res, next) => {
  console.log('Hello from the middleware ????');
  next();
});
 */
//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  console.log(req.cookies);
  next();
});

// ROUTS
//for this routes/url's use the routers
//route = url, router is object, that has a route as a property

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); //this middleware only happens in this url, (we call this mounting)
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  /*   res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  }); */

  /* const err = new Error(`Can't find ${req.originalUrl} on this server!`); //message of Error Object
  err.statusCode = 404;
  err.status = 'fail'; */

  //next with a parameter is an error
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//global error middle-ware
app.use(globalErrorHandler);

//will be used in server
module.exports = app;
