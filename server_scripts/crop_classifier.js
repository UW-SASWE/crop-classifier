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

// shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

async function loadGeojson(path) {
  try {
    var geoJSONData = await readFile(path);
    var geoJSONDataJson = JSON.parse(geoJSONData);
    return geoJSONDataJson;
  } catch {
    console.log("Could not load geoJSON data.\nError parsing JSON string");
  }
}
var assets = {};
const cc = {
  // This startup uses google earth engine
  startup: async function (req, res, next) {
    var roiPath = "./cc_assets/Region_of_interest.geojson";
    var roiGeojson = await loadGeojson(roiPath);
    assets.roi = ee.FeatureCollection(roiGeojson);
  },
  loadBangladeshBoundary: async function (req, res, next) {
    var path = "./cc_assets/bg_boundary.geojson";
    var geoJSON = loadGeojson(path);
    res.send(geoJSON);
  },
  loadDivisions: async function (req, res, next) {
    var path = "./cc_assets/bg_divisions.geojson";
    var geoJSON = await loadGeojson(path);
    res.send(geoJSON);
  },
  loadZilas: async function (req, res, next) {
    var path = "./cc_assets/bg_zilas.geojson";
    var geoJSON = await loadGeojson(path);
    res.send(geoJSON);
  },
  loadUpazilas: async function (req, res, next) {
    var path = "./cc_assets/bg_upazilas.geojson";
    var geoJSON = await loadGeojson(path);
    res.send(geoJSON);
  },
  loadUnions: async function (req, res, next) {
    var path = "./cc_assets/bg_unions.geojson";
    var geoJSON = await loadGeojson(path);
    res.send(geoJSON);
  },
  loadRoi: async function (req, res, next) {
    var roiPath = "./cc_assets/bg_boundary.geojson";
    // var roiPath = "./cc_assets/Region_of_interest.geojson";
    var roiGeojson = await loadGeojson(roiPath);
    req.roi = ee.FeatureCollection(roiGeojson);
    req.roi.getMap({}, async ({}) => {
      next();
    });
  },
  loadTrainingPoints: async function (req, res, next) {
    // var roiPath = "./cc_assets/bg_boundary.geojson";
    // var tPPath = "./cc_assets/training_pts.geojson";
    // var tpGeojson = await loadGeojson(tPPath);
    // req.tp = ee.FeatureCollection(tpGeojson);
    // var vPPath = "./cc_assets/training_pts.geojson";
    // var vpGeojson = await loadGeojson(vPPath);
    // req.vp = ee.FeatureCollection(vpGeojson);
    // req.tp.getMap({}, async ({}) => {
    //   req.vp.getMap({}, async ({}) => {
    //     next();
    //   });
    // });

    var geoJSON = await csvToGeojson(req.body.csvData);
    geoJSON.features = shuffleArray(geoJSON.features);
    var split = Math.floor(
      (req.body.splitRatio * geoJSON.features.length) / 100
    );
    var tpGeojson = geoJSON,
      vpGeojson = geoJSON;
    vpGeojson.features = geoJSON.features.slice(split);
    tpGeojson.features = geoJSON.features.slice(0, split);

    req.tp = ee.FeatureCollection(tpGeojson);
    req.vp = ee.FeatureCollection(vpGeojson);

    req.tp.getMap({}, async ({}) => {
      req.vp.getMap({}, async ({}) => {
        next();
      });
    });
  },
  train: async function (req, res, next) {
    // var roi = req.roi,
    //   trainingPts = req.trainingPts,
    //   validationPts = req.validationPts;

    // Import the maize target region asset.
    // var roi = ee.FeatureCollection(
    //   "projects/earthengine-community/tutorials/classify-maizeland-ng/aoi"
    // );
    var roi = req.roi;

    // Import ground truth data that are divided into training and validation sets.
    // var trainingPts = ee.FeatureCollection(
    //   "projects/earthengine-community/tutorials/classify-maizeland-ng/training-pts"
    // );

    var trainingPts = req.tp;
    // var validationPts = ee.FeatureCollection(
    //   "projects/earthengine-community/tutorials/classify-maizeland-ng/validation-pts"
    // );
    var validationPts = req.vp;

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

    // save one of the trained models
    (async function () {
      try {
        var explanation = await trainedRf.explain().getInfo((info) => {
          console.log("pass");
          return info;
        });
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

    // console.log(s2c);
    res.send({ response: "Okay" });
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
