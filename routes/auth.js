var express = require("express");
const mysql = require("mysql2");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var crypto = require("crypto");
var db = require("../db");

passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    db.getConnection(function (err, connection) {
      if (err) {
        return console.error("error: " + err.message);
      }
      const sqlSearch = "SELECT * FROM users WHERE username = ?";
      const searchQuery = mysql.format(sqlSearch, [username]);
      connection.query(searchQuery, function (err, row) {
        if (err) {
          return cb(err);
        }
        if (!row) {
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }

        // console.log(row[0].salt)

        crypto.pbkdf2(
          password,
          row[0].salt,
          310000,
          32,
          "sha256",
          function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (
              !crypto.timingSafeEqual(row[0].hashed_password, hashedPassword)
            ) {
              return cb(null, false, {
                message: "Incorrect username or password.",
              });
            }
            return cb(null, row);
          }
        );
      });
    });
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

var router = express.Router();

router.get("/login", function (req, res, next) {
  res.render("auth/login", { title: "Crop classifier login" });
});

router.post(
  "/login/password",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

module.exports = router;
