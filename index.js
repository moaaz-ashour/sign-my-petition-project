var bodyParser = require("body-parser");
var express = require('express');
var app = express();
var hb = require("express-handlebars");
var pg = require('pg');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var db = require('./db/db');
var middleWare = require('./middleware');
var user = require('./routes/user');
var homepage = require('./routes/homepage');

app.use(cookieParser());
app.use(cookieSession({
   secret: process.env.SESSION_SECRET || 'Help Dogs!',
   maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(bodyParser.urlencoded({
   extended: false
}));

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use(function(req, res, next){
   if (req.url === '/'){
      res.redirect('/register');
   } else {
      next();
   }
});

app.use(middleWare.requireLogIn);

app.use('/', user);
app.use('/', homepage);

app.use(function errorHandler (err, req, res, next) {
   if (res.headersSent) {
     return next(err);
   }
   res.status(500).send("Something went wrong! Maybe you want to register or login to see this page.");
});

app.listen(process.env.PORT || 8080, function(){
   console.log("Listening!");
});
