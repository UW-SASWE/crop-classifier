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

// Get and display the basic polygons on the map
// load BG boundary
router.get("/cropclassifier/bg_boundary", cc.loadBangladeshBoundary);
// load BG divisions
router.get("/cropclassifier/bg_divisions", cc.loadDivisions);
// load BG zilas
router.get("/cropclassifier/bg_zilas", cc.loadZilas);
// load BG upazilas
router.get("/cropclassifier/bg_upazilas", cc.loadUpazilas);
// load BG unions
router.get("/cropclassifier/bg_unions", cc.loadUnions);

// Training and classification
router.post("/cropclassifier/displaytrainingpoints",cc.displayTrainingPoints)
router.post(
  "/cropclassifier/train",
  cc.loadRoi,
  cc.loadTrainingPoints,
  cc.train
); // Train
router.get("/cropclassifier/classify", cc.classify); // Classify

module.exports = router;
