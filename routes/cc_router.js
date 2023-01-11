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
// router.get("/cropclassifier/bg_boundary", cc.loadCountry); // get entire country
// router.get("/cropclassifier/bg_divisions", cc.loadDivisions); // get entire divisions
// router.get("/cropclassifier/bg_zilas", cc.loadZilas); // get entire zilas
// router.get("/cropclassifier/bg_upazilas", cc.loadUpazilas); // get entire upazilas
// router.get("/cropclassifier/bg_unions", cc.loadUnions); // get entire unions
router.get("/cropclassifier/loadPolygon", cc.loadPolygon); // request for a polygon

// Post request to display specific boundaries (filtered)
// router.post("/cropclassifier/bg_boundary", cc.loadCountry); // request for a country
// router.post("/cropclassifier/bg_divisions", cc.loadDivisions); // request for a division
// router.post("/cropclassifier/bg_zilas", cc.loadZilas); // request for a zila
// router.post("/cropclassifier/bg_upazilas", cc.loadUpazilas); // request for an upazila
// router.post("/cropclassifier/bg_unions", cc.loadUnions); // request for a union

router.post("/cropclassifier/loadPolygon", cc.loadPolygon); // request for a polygon


// Training and classification
router.post("/cropclassifier/displaytrainingpoints", cc.displayTrainingPoints);
router.post(
  "/cropclassifier/train",
  cc.loadRoi,
  cc.loadTrainingPoints,
  cc.train
); // Train
router.post("/cropclassifier/scope", cc.scope);
router.get("/cropclassifier/classify", cc.classify); // Classify

module.exports = router;
