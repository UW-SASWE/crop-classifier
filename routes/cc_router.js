var express = require("express");
var cc = require("../server_scripts/crop_classifier");

var router = express.Router();

/* GET the crop classifier home page. */
router.get("/cropclassifier", function (req, res, next) {
  res.render("crop_classifier/index", {
    title: "Crop Classifier - Bangladesh",
    currentYear: new Date().getFullYear().toString(),
  });
});

router.get("/cropclassifier/startup", cc.startup);

router.get("/cropclassifier/loadPolygon", cc.loadPolygon); // request for a polygon
router.post("/cropclassifier/loadPolygon", cc.loadPolygon); // request for a polygon


// Training and classification
router.post("/cropclassifier/displaytrainingpoints", cc.displayTrainingPoints);
router.post(
  "/cropclassifier/train",
  cc.loadRoi,
  cc.loadTrainingPoints,
  cc.train
); // Train
router.get("/cropclassifier/trainresults", cc.sendTrainResults)
router.post("/cropclassifier/scope", cc.scope);
router.get("/cropclassifier/classify", cc.classify); // Classify

module.exports = router;
