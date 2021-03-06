const pg = require('pg');
var config;

var dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
   config = require('../config.json');
   dbUrl = `postgres://${config.postgresUser}:${config.postgresPassword}@localhost:5432/${config.postgresDb}`;
}

dbUrl = require('url').parse(dbUrl);

const dbUser = dbUrl.auth.split(':');

const dbConfig = {
   user: dbUser[0],
   database: dbUrl.pathname.slice(1),
   password: dbUser[1],
   host: dbUrl.hostname,
   port: 5432,
   max: 10,
   idleTimeoutMillis: 30000
};

const pool = new pg.Pool(dbConfig);

pool.on('error', function(err) {
   console.log(err);
});

exports.query = function(query, params, callback) {
   callback = typeof params == 'function' ? params : callback;
   params = Array.isArray(params) ? params : [];

   return new Promise(function(resolve, reject) {
      pool.connect(function(err, client, done) {
         if (err) {
            reject(err);
            callback && callback(err);
         } else {
            client.query(query, params, function(err, data) {
               if (err) {
                  reject(err);
                  callback && callback(err);
               } else {
                  resolve(data);
                  callback && callback(null, data);
               }
               done();
            });
         }
      });
   });
};
