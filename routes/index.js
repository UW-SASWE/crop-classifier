var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('cover', { title: "Crop Classifier - Bangladesh" }); }
  next();
}, function(req, res, next) {
  res.render('crop_classifier/index', { title: 'Crop Classifier - Bangladesh' });
});

module.exports = router;
