const mysql = require("mysql2/promise");
require("dotenv").config();
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
// var crypto = require("crypto");

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PORT = process.env.DB_PORT;

options = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD, // use dotenv to load the hidden environmental variable. Look further
  database: DB_DATABASE, // Database name
  port: DB_PORT, // port name
};

const connection = mysql.createPool(options);
var sessionStore = new MySQLStore(
  {
    createDatabaseTable: false,
    expiration: 86400000,
    // expiration: 300000,
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  },
  connection
);

module.exports = sessionStore;
