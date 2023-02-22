var express = require("express");
const mysql = require("mysql2");
var passport = require("passport");
var LocalStrategy = require("passport-local");
// Explore using a GoogleStrategy (https://github.com/jaredhanson/passport-google-oauth2)
var crypto = require("crypto");
var db = require("../server_scripts/database");

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
        if (!row[0]) {
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }

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
            return cb(null, row[0]);
          }
        );
      });
    });
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username, role: user.role, workgroup: user.workgroup});
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
  passport.authenticate(
    "local",
    {
      successRedirect: "/cropclassifier",
      failureRedirect: "/",
      failureMessage: true,
    }
  ),
  // function (req, res, next) {
  //   console.log(req.user);
  //   res.redirect('/cropclassifier');
  // }
);

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
