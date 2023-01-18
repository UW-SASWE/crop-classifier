const mysql = require("mysql2");
require("dotenv").config();
var crypto = require("crypto");

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PORT = process.env.DB_PORT;

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD, // use dotenv to load the hidden environmental variable. Look further
  database: DB_DATABASE, // Database name
  // port: DB_PORT, // port name /*required when running app locally*/
});

db.getConnection(function (err, connection) {
  if (err) {
    return console.error("error: " + err.message);
  }
  console.log("Connected to the MySQL server: " + connection.threadId);
});

module.exports = db;
