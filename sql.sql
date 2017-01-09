DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE signatures (
   id SERIAL primary key,
   signatures TEXT,
   user_id INT,
   signature_id SERIAL,
   timestamp TIMESTAMP default current_timestamp
);

CREATE TABLE users (
   id SERIAL primary key,
   first_name VARCHAR(255) not null,
   last_name VARCHAR(255) not null,
   email VARCHAR(255) not null unique,
   password VARCHAR(255) not null,
   timestamp TIMESTAMP default current_timestamp
);

CREATE TABLE user_profiles (
   id SERIAL primary key,
   user_id INT,
   age INT,
   city VARCHAR(255),
   url VARCHAR(255),
   timestamp TIMESTAMP default current_timestamp
);
