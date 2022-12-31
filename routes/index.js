var express = require("express");
var router = express.Router();

/* GET home page. */
router.get(
  "/",
  function (req, res, next) {
    if (!req.user) {
      console.log(req.session.messages)
      var errMessage;
      var showErr;
      if (req.session.messages) {
        var errMessage = req.session.messages.pop();
        var showErr = "show";
      } else {
        var errMessage = "";
        var showErr = "";
      }

      return res.render("index", { title: "Crop Classifier - Bangladesh", errMessage: errMessage, collapseShow: showErr});
    }
    next();
  },
  function (req, res, next) {
    res.redirect("/cropclassifier");
  }
);

module.exports = router;
