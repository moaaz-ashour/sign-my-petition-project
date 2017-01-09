var express = require('express'),
   router = express.Router();

var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

var dbase = require('../db/db');
var middleWare = require('../middleware');
var hashingAndChecking = require ('../password/checking-hashing');

//registereration
router.route('/register')
.get(middleWare.requireLoggedOut, csrfProtection, function(req, res){
   res.render('registeration', {
      layout: 'registeration-layout',
      csrfToken: req.csrfToken()
   });
})
.post(function(req, res){
   var reqBody = req.body;
   if (!reqBody.firstname || !reqBody.lastname || !reqBody.email || !reqBody.password) {
      res.render('notenoughdata', {
         layout: 'registeration-layout'
      });
   }else {
      hashingAndChecking.hashPassword(req.body.password).then(function(hashedPass){
         var query = 'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id';
         var params = [req.body.firstname, req.body.lastname, req.body.email, hashedPass];
         var fillUsersTable = dbase.query(query, params);
         return fillUsersTable.then(function(data){
            req.session.user = {
               id: data.rows[0]['id'],
               first_name: req.body.firstname,
               last_name: req.body.lastname,
               email: req.body.email
            }
            res.redirect('/moreinfo');
         }).catch(function(err){
            res.render('registeration', {
               layout: 'registeration-layout',
               emailExists: 'Email already exists! Please try to login.',
            });
         })
      })
   }
});

//ask the user for more information after registeration
router.route('/moreinfo')
.get(csrfProtection, function(req, res) {
   res.render('moreinfo', {
      layout: 'moreinfo-layout',
      csrfToken: req.csrfToken()
   });
})
.post(function(req, res){
   var reqBody = req.body;
   var id = req.session.user.id;
   var age = req.body.age || null;
   var city = req.body.city.toLowerCase();
   var url = req.body.homepageUrl;
   var query = 'INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4)';
   var params = [id, age, city, url];
   var appendProfile = dbase.query(query, params);
   return appendProfile.then(function(data){
      res.redirect('/homepage');
   }).catch(function(err){
      console.log(err);
   });
});

//login middleWare.requireLoggedOut,
router.route('/login')
.get(middleWare.requireLoggedOut, csrfProtection, function(req, res){
   res.render('login', {
      layout:'login-layout',
      csrfToken: req.csrfToken()
   });
})
.post(function(req, res){
   if(!req.body.email || !req.body.password) {
      res.render('login', {
         layout:'login-layout',
         loginInfoMissing: 'All fields are required. Please fill in your information.'
      });
   } else {
      var query = 'SELECT id, first_name, last_name, email, password FROM users WHERE email = $1';
      var params = [req.body.email];
      if (req.body.email && req.body.password) {
         var getPass = dbase.query(query, params);
         getPass.then(function(data){
            req.session.user = {
               id: data.rows[0]['id'],
               first_name: data.rows[0]['first_name'],
               last_name: data.rows[0]['last_name'],
               email: data.rows[0]['email']
            }
            var id = data.rows[0]['id'];
            var checkPass = hashingAndChecking.checkPassword(req.body.password, data.rows[0]['password']); //typedPass, dbPass
            checkPass.then(function(data){
               if(data === true){
                  var query = 'SELECT signatures FROM signatures WHERE user_id = $1';
                  var params = [id];
                  var signature = dbase.query(query, params);
                  signature.then(function(data){
                     res.redirect('/thankyou');
                  }).catch(function(err){
                     res.redirect('/homepage');
                  })
               } else if (data === false) {
                  res.render('login', {
                     layout:'login-layout',
                     wrongEmailOrPassword: 'Wrong email or password!'
                 });               }
            }).catch(function(err){
               console.log(err);
            });
         }).catch(function(err){
         console.log(err);
            res.render('login', {
               layout:'login-layout',
               wrongEmailOrPassword: 'Wrong email or password!'
            })
         })
      }
   }
});

//thank you for signing
router.get('/thankyou', function(req, res){
   var id = req.session.user.id;
   var query = 'SELECT signatures FROM signatures WHERE user_id = $1';
   var params = [id];
   var signature = dbase.query(query, params);
   signature.then(function(data){
      var signatureimage = data.rows[0]['signatures'];
      res.render('thankyou', {
         signatureimage,
         layout: 'thankyou-layout'
      });
   }).catch(function(err){
      console.log(err);
   })
});

//show list of petition signers
router.get('/signers', function(req, res){
   var query = 'SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city FROM users INNER JOIN user_profiles ON users.id=user_profiles.user_id';
   var getSigners = dbase.query(query);
   return getSigners.then(function(data){
      var signees = data.rows;
      res.render('signers', {
         signees,
         layout:'signers-layout'
      });
   }).catch(function(err){
      console.log(err);
   });
});

router.get('/signed/:city', csrfProtection, function(req,res){
   var city = req.params.city;
   var query = "SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM signatures LEFT JOIN users ON signatures.user_id = users.id LEFT JOIN user_profiles ON signatures.user_id = user_profiles.user_id WHERE user_profiles.city = '" + city + "'";
   var getAllSignees = dbase.query(query);
   getAllSignees.then(function(data){
      var signeesPerCity = data.rows;
      res.render('citysigners', {
         layout: 'citysigners-layout',
         signeesPerCity: data.rows,
         city: data.rows[0].city,
         numOfSignees: data.rows.length
      });
   }).catch(function(err){
      console.log(err);
   });
});

//enable the user to edit their profile
router.route('/editprofile')
.get(csrfProtection, function(req, res){
   var query = 'SELECT users.first_name, users.last_name, users.email, user_profiles.age, user_profiles.city, user_profiles.url FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE user_id = $1';
   var params = [req.session.user.id];
   var userInfo = dbase.query(query, params);
   userInfo.then(function(data){
      req.session.user = {
        id: params[0],
        first_name: data.rows[0].first_name,
        last_name: data.rows[0].last_name,
        email: data.rows[0].email,
        age: data.rows[0].age,
        city: data.rows[0].city,
        url: data.rows[0].url
      }
      res.render('edit', {
         layout: 'edit-layout',
         update: 'Update your signature/profile.',
         firstName: data.rows[0].first_name,
         lastName: data.rows[0].last_name,
         email: data.rows[0].email,
         age: data.rows[0].age,
         city: data.rows[0].city,
         url: data.rows[0].url,
         csrfToken: req.csrfToken()
      })
   });
})
.post(function(req, res){
   if(req.body.signature){
      var query = 'UPDATE signatures SET signatures = $1 WHERE user_id=$2';
      var params = [req.body.signature, req.session.user];
      var editSignature = dbase.query(query, params);
      editSignature.then(function(){
         res.redirect('/thankyou');
      }).catch(function(err){
         console.log(err);
      })
   }
   var age = req.body.age;
   if (req.body.password !== ''){
      hashingAndChecking.hashPassword(req.body.password).then(function(hashedPass){
         var queryProfile = 'UPDATE user_profiles SET user_id = $1, age = $2, city = $3, url = $4 WHERE user_id = $5';
         var paramsProfile = [req.session.user.id, age, req.body.city, req.body.url, req.session.user.id];
         var appendProfile = dbase.query(queryProfile, paramsProfile);
         var queryUser = 'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4';
         var paramsUser = [req.body.first_name, req.body.last_name, req.body.email, req.session.user.id];
         dbase.query(queryUser, paramsUser);
         appendProfile.then(function(){
            var query = 'UPDATE users SET password = $1 WHERE id = $2';
            var params = [hashedPass, req.session.user.id]
            var appendNewInfo = dbase.query(query,params).then(function(){
               res.redirect('/thankyou');
            }).catch(function(err){
               console.log(err)
            })
         }).catch(function(err){
            console.log(err)
         })
      })
   }
   if (req.body.password === ''){
      var age = req.body.age;
      var query = 'UPDATE user_profiles SET user_id = $1, age = $2, city = $3, url = $4 WHERE id = $5';
      var params = [req.session.user.id, age, req.body.city, req.body.url, req.session.user.id];
      var appendProfile = dbase.query(query, params);
      var queryUser = 'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4';
      var paramsUser = [req.body.first_name, req.body.last_name, req.body.email, req.session.user.id];
      dbase.query(queryUser, paramsUser);
      appendProfile.then(function(){
         res.redirect('/thankyou');
      }).catch(function(err){
         console.log(err)
      })
   }
});

//delete profile
router.route('/delete')
.get(csrfProtection, function(req, res){

})
.post(function(req,res){
   var query = 'DELETE FROM signatures WHERE user_id = $1';
   var params = [req.session.user.id];
   dbase.query(query, params).then(function(){
      res.redirect('/homepage');
   }).catch(function(err){
      console.log(err);
   })
});

//logout
router.get('/logout', function (req,res) {
   req.session = null;
   res.redirect('/register');
});


module.exports = router;
