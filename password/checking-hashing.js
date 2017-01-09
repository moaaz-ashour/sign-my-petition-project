var bcrypt = require('bcrypt');

exports.hashPassword = function (plainTextPassword) {
   return new Promise(function(resolve, reject){
      bcrypt.genSalt(function(err, salt) {
         if (err) {
            reject(err);
            return;
         }
         bcrypt.hash(plainTextPassword, salt, function(err, hash) {
            if (err) {
               reject(err);
               return;
            }
            resolve(hash);
         });
      });
   });
}
exports.checkPassword = function (typedPass, dbPass) {
    return new Promise(function(resolve, reject){
        bcrypt.compare(typedPass, dbPass, function(err, results) { 
            if (err) {
               reject(err);
               return;
            }
            resolve(results);
        });
   });
}
