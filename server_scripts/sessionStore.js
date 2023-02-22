const mysql = require("mysql2/promise");
require("dotenv").config();
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
// var crypto = require("crypto");

options = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // use dotenv to load the hidden environmental variable. Look further
  database: process.env.DB_DATABASE, // Database name
  port: process.env.DB_PORT, // port name
};

const connection = mysql.createPool(options);
var sessionStore = new MySQLStore(
  {
    createDatabaseTable: false,
    expiration: Number(process.env.SESS_LIFETIME),
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
