var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileUpload = require("express-fileupload")
var db = require("./config/connection")
const userHelpers = require('./helpers/user-helpers')
var session = require('express-session')

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

const hbs = require("express-handlebars")
const dotenv = require('dotenv')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.create({ 
  extname: 'hbs', 
  defaultLayout: "layout", 
  layoutsDir: __dirname + '/views/layout/', 
  partialsDir: __dirname + '/views/partials/',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    eq: function(a, b) {
      return a === b;
    },
    gt: function(a, b) {
      return a > b;
    },
    sub: function(a, b) {
      return a - b;
    },
    add: function(a, b) {
      return a + b;
    },
    formatDate: function(date) {
      if (!date) return 'N/A';
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(date).toLocaleDateString('en-US', options);
    }
  }
}).engine)

dotenv.config()

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
db.connect((err) => {
  if (err) {
    console.log("database Connection Error" + err)
  } else {
    console.log('Database Connected Success')
    // Create default admin if none exists
    userHelpers.createDefaultAdmin().then(() => {
      console.log('Admin initialization completed')
    }).catch((error) => {
      console.error('Admin initialization error:', error)
    })
  }
})


app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
