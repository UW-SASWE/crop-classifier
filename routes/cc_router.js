var express = require("express");
var cc = require("../crop_classifier");

// special functions for the main cropclassification app


var router = express.Router();


/* GET the crop classifier home page. */
router.get('/cropclassifier', function(req, res, next) {
    res.render('crop_classifier/index', { title: 'Crop Classifier - Bangladesh' });
  });

module.exports = router;
