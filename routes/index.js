var express = require("express");
var router = express.Router();

/* GET home page. */
router.get(
  "/",
  function (req, res, next) {
    if (!req.user) {
      return res.render("index", { title: "Crop Classifier - Bangladesh" });
    }
    next();
  },
  function (req, res, next) {
    res.redirect("/cropclassifier");
  }
);

module.exports = router;
