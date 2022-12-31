const ee = require("@google/earthengine"); //earth engine module
require("dotenv").config();
const fs = require("fs");
const csvToGeojson = require("./csvToGeojson");

// read json files with a promise
const readFile = (path, opts = {}) =>
  new Promise((resolve, reject) => {
    fs.readFile(path, opts, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

var privateKey = JSON.parse(process.env.EE_PRIVATE_KEY); //TODO: try encrypting the key lateron

// Initialize client library and run analysis.
var runAnalysis = function () {
  ee.initialize(
    null,
    null,
    function () {
      // ... run analysis ...
      console.log("GEE authentication and initialization successful!");
      // TODO: add a startup process here.
    },
    function (e) {
      console.error("Initialization error: " + e);
    }
  );
};

// Authenticate using a service account.
ee.data.authenticateViaPrivateKey(privateKey, runAnalysis, function (e) {
  console.error("Authentication error: " + e);
});

const cc = {
  // This startup uses google earth engine
  startup: async function (req, res, next) {
    // var bg_boundary = ee
    //   .FeatureCollection("USDOS/LSIB_SIMPLE/2017")
    //   .filter(ee.Filter.eq("country_co", "BG"));
    // var bg_feature = ee.Feature(bg_boundary.first());
    // var bg_centroid = bg_feature.centroid().geometry().coordinates().getInfo();
    // // console.log([bg_centroid[1], bg_centroid[0]]);
    // var mapid = bg_feature.getMap({}, async ({ urlFormat }) => {
    //   //   console.log(urlFormat);
    //   //   console.log('me')
    //   // var urlFormat = await urlFormat;
    //   res.send({
    //     urlFormat: urlFormat,
    //     center: [bg_centroid[1], bg_centroid[0]],
    //   });
    //   //   return url;
    // });
  },
  loadBangladeshBoundary: async function (req, res, next) {
    var path = "./cc_assets/bg_boundary.geojson";
    (async function () {
      try {
        var bgBoundaryData = await readFile(path);
        var bgBoundaryDataJson = JSON.parse(bgBoundaryData);
        console.log(bgBoundaryDataJson);
        res.send(bgBoundaryDataJson);
      } catch {
        console.log(
          "Could not load Bangladesh boundary.\nError parsing JSON string"
        );
      }
    })();
  },
  loadDivisions: async function (req, res, next) {
    var path = "./cc_assets/bg_divisions.geojson";
    (async function () {
      try {
        var bgDivisionsData = await readFile(path);
        var bgDivisionsDataJson = JSON.parse(bgDivisionsData);
        res.send(bgDivisionsDataJson);
      } catch {
        console.log("Could not load Divisions.\nError parsing JSON string");
      }
    })();
  },
  loadZilas: async function (req, res, next) {
    var path = "./cc_assets/bg_zilas.geojson";
    (async function () {
      try {
        var bgZilasData = await readFile(path);
        var bgZilasDataJson = JSON.parse(bgZilasData);
        res.send(bgZilasDataJson);
      } catch {
        console.log("Could not load Zilas.\nError parsing JSON string");
      }
    })();
  },
  loadUpazilas: async function (req, res, next) {
    var path = "./cc_assets/bg_upazilas.geojson";
    (async function () {
      try {
        var bgUpazilasData = await readFile(path);
        var bgUpazilasDataJson = JSON.parse(bgUpazilasData);
        res.send(bgUpazilasDataJson);
      } catch {
        console.log("Could not load Upazilas.\nError parsing JSON string.");
      }
    })();
    // (async function () {
    //   try {
    //     var geoJSON = await csvToGeojson("./cc_assets/training_points.csv");
    //     // console.log(geoJSON);
    //     res.send(geoJSON);
    //   } catch {
    //     ("Diddn't work");
    //   }
    // })();
  },
  loadUnions: async function (req, res, next) {
    var path = "./cc_assets/bg_unions.geojson";
    (async function () {
      try {
        var bgBoundaryData = await readFile(path);
        var bgBoundaryDataJson = JSON.parse(bgBoundaryData);
        res.send(bgBoundaryDataJson);
      } catch {
        console.log("Could not load Unions.\nError parsing JSON string");
      }
    })();
  },
  train: async function (req, res, next) {
    // Import the maize target region asset.
    var roi = ee.FeatureCollection(
      "projects/earthengine-community/tutorials/classify-maizeland-ng/aoi"
    );

    // Display the maize target area boundary to the map.
    // Map.addLayer(roi, { color: "white", strokeWidth: 5 }, "ROI", true, 0.6);
    // roi_id = roi.getMap({ color: "white", strokeWidth: 5 });

    // Import ground truth data that are divided into training and validation sets.
    var trainingPts = ee.FeatureCollection(
      "projects/earthengine-community/tutorials/classify-maizeland-ng/training-pts"
    );
    var validationPts = ee.FeatureCollection(
      "projects/earthengine-community/tutorials/classify-maizeland-ng/validation-pts"
    );

    // Import S2 TOA reflectance and corresponding cloud probability collections.
    var s2 = ee.ImageCollection("COPERNICUS/S2");
    var s2c = ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY");

    // Define dates over which to create a composite.
    var start = ee.Date("2017-06-15");
    var end = ee.Date("2017-10-15");

    // Define a collection filtering function.
    function filterBoundsDate(imgCol, roi, start, end) {
      return imgCol.filterBounds(roi).filterDate(start, end);
    }

    // Filter the collection by ROI and date.
    s2 = filterBoundsDate(s2, roi, start, end);
    s2c = filterBoundsDate(s2c, roi, start, end);

    // Define a function to join the two collections on their 'system:index'
    // property. The 'propName' parameter is the name of the property that
    // references the joined image.
    function indexJoin(colA, colB, propName) {
      var joined = ee.ImageCollection(
        ee.Join.saveFirst(propName).apply({
          primary: colA,
          secondary: colB,
          condition: ee.Filter.equals({
            leftField: "system:index",
            rightField: "system:index",
          }),
        })
      );
      // Merge the bands of the joined image.
      return joined.map(function (image) {
        return image.addBands(ee.Image(image.get(propName)));
      });
    }

    // Define a function to create a cloud masking function.
    function buildMaskFunction(cloudProb) {
      return function (img) {
        // Define clouds as pixels having greater than the given cloud probability.
        var cloud = img.select("probability").gt(ee.Image(cloudProb));

        // Apply the cloud mask to the image and return it.
        return img.updateMask(cloud.not());
      };
    }

    // Join the cloud probability collection to the TOA reflectance collection.
    var withCloudProbability = indexJoin(s2, s2c, "cloud_probability");

    // Map the cloud masking function over the joined collection, select only the
    // reflectance bands.
    var maskClouds = buildMaskFunction(50);
    var s2Masked = ee
      .ImageCollection(withCloudProbability.map(maskClouds))
      .select(ee.List.sequence(0, 12));

    // Calculate the median of overlapping pixels per band.
    var median = s2Masked.median();

    // Calculate the difference between each image and the median.
    var difFromMedian = s2Masked.map(function (img) {
      var dif = ee.Image(img).subtract(median).pow(ee.Image.constant(2));
      return dif
        .reduce(ee.Reducer.sum())
        .addBands(img)
        .copyProperties(img, ["system:time_start"]);
    });

    // Generate a composite image by selecting the pixel that is closest to the
    // median.
    var bandNames = difFromMedian.first().bandNames();
    var bandPositions = ee.List.sequence(1, bandNames.length().subtract(1));
    var mosaic = difFromMedian
      .reduce(ee.Reducer.min(bandNames.length()))
      .select(bandPositions, bandNames.slice(1))
      .clipToCollection(roi);

    // Specify and select bands that will be used in the classification.
    var bands = [
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "B8A",
      "B9",
      "B10",
      "B11",
      "B12",
    ];
    var imageCl = mosaic.select(bands);

    // Overlay the training points on the imagery to get a training sample; include
    // the crop classification property ('class') in the sample feature collection.
    var training = imageCl
      .sampleRegions({
        collection: trainingPts,
        properties: ["class"],
        scale: 30,
        tileScale: 8,
      })
      .filter(ee.Filter.neq("B1", null)); // Remove null pixels.

    // Train a CART classifier with default parameters.
    var trainedCart = ee.Classifier.smileCart().train({
      features: training,
      classProperty: "class",
      inputProperties: bands,
    });

    // Train a random forest classifier with default parameters.
    var trainedRf = ee.Classifier.smileRandomForest({
      numberOfTrees: 10,
    }).train({
      features: training,
      classProperty: "class",
      inputProperties: bands,
    });

    (async function () {
      try {
        var explanation = await trainedRf.explain().getInfo();
        console.log(explanation.numberOfTrees);
        fs.writeFile(
          "./cc_assets/mlExplanation.json",
          JSON.stringify(explanation),
          (err) => {
            if (err) {
              console.log("The file was not saved: ", err);
            }
            console.log("The file has been saved!");
          }
        );
      } catch {
        console.log("Unable to get explanation.");
      }
    })();
    // var explanation = trainedRf.explain().getInfo()
    // console.log("Number of Trees: ", explanation.numberOfTrees);
  },
  classify: async function (req, res, next) {
    console.log("Running the classification from trained model");
    var mlExplanationPath = "cc_assets/mlExplanation.json";
    var trainedClassifier;
    try {
      var mlExplanationData = await readFile(mlExplanationPath);
      var mlExplanationDataJson = JSON.parse(mlExplanationData);
      console.log("Number of trees: ", mlExplanationDataJson.numberOfTrees);
    } catch {
      console.log("Error parsing JSON string");
    }
  },
};

// cc.startup1()

module.exports = cc;
