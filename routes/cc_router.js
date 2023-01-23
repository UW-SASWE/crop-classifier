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
  function (req, res, next) {
    switch (req.user.role) {
      case "user":
        res.sendStatus(401);
        break;
      case "administrator":
      case "developer":
        next();
        break;
    }
  },
  cc.loadTrainRoi,
  cc.loadTrainingPoints,
  cc.train
); // Train
router.get("/cropclassifier/trainresults", cc.sendTrainResults);
router.post("/cropclassifier/scope", cc.scope);
// Classify
router.post(
  "/cropclassifier/classify",
  cc.laodClassifyRoi,
  cc.loadClassifiedModel,
  cc.classify
);
router.get("/cropclassifier/classifyresults", cc.sendClassifyResults);

module.exports = router;
