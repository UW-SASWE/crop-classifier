var express = require("express");
var cc = require("../crop_classifier");

var router = express.Router();

/* GET the crop classifier home page. */
router.get("/cropclassifier", function (req, res, next) {
  res.render("crop_classifier/index", {
    title: "Crop Classifier - Bangladesh",
  });
});

router.get(
  "/cropclassifier/startup",
  cc.startup // invoke startup function
);

module.exports = router;
