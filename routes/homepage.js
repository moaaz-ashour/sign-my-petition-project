var express = require('express'),
router = express.Router();

var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

var dbase = require('../db/db');
var middleWare = require('../middleware');

router.route('/homepage')
.get(csrfProtection, function(req,res){
   var id = req.session.user.id;
   var query = 'SELECT signatures FROM signatures WHERE user_id = $1';
   var params = [id];
   var signature = dbase.query(query, params);
   signature.then(function(data){
      res.render('homepage', {
         layout: 'homepage-layout',
         csrfToken: req.csrfToken()
      });
   }).catch(function(err){
      console.log(err);
   })
})
.post(function(req, res){
   if (!req.body.signature){
      res.render('homepage', {
         layout: 'homepage-layout',
         pleaseSign: "Please sign if you wish to proceed!"
      })
   }
   else {
      var id = req.session.user.id;
      var query = 'INSERT INTO signatures (signatures, user_id) VALUES ($1, $2)';
      var params = [req.body.signature, id];
      var fillSignaturesTable = dbase.query(query, params);
      return fillSignaturesTable.then(function(){
         res.redirect('/thankyou');
      }).catch(function(err){
         console.log(err);
         res.render('homepage', {
            layout: 'homepage-layout',
            signToContinue: 'You must sign to submit'
         });
      });
   }
});


module.exports = router;
