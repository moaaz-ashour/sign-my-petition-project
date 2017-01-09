var dbase = require('../db/db');

exports.requireLoggedOut = function (req, res, next) {
   if (req.session.user) {
      res.redirect('/homepage');
   } else {
      next();
   }
}

exports.requireLogIn = function(req, res, next) {
   if (req.url != '/register' && req.url != '/login') {
      if (!req.session.user) {
         res.redirect('/register')
      } else {
         next();
      }
   } else {
      next();
   }
};

exports.requireSignedThePetition = function(req, res, next){
   var query = 'SELECT signatures FROM signatures WHERE user_id = $1';
   var params = [req.session.user];
   dbase.query(query, params).then(function(data){
      if (!data.rows[0]['signatures']){
         res.redirect('/homepage');
      } else {
         next();
      }
   })
}

exports.requireNotSignedThePetition = function(req, res, next){
   var query = 'SELECT signatures FROM signatures WHERE user_id = $1';
   var params = [req.session.user];
   dbase.query(query, params).then(function(data){
      if (data.rows[0]['signatures']){
         res.redirect('/thankyou');
      } else {
         next();
      }
   })
}
