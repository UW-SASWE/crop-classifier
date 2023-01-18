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

async function loadScopes(path) {
  try {
    var scopesData = await readFile(path);
    var scopesDataJson = JSON.parse(scopesData);
    return scopesDataJson;
  } catch {
    console.log("Could not load scopes data.\nError parsing JSON string");
  }
}

const seasons = {
  boro: { startDateSuffix: "-01-01", endDateSuffix: "-04-30" },
  aus: { startDateSuffix: "-05-01", endDateSuffix: "-07-31" },
  aman: { startDateSuffix: "-08-01", endDateSuffix: "-12-31" },
};

const cc = {
  // This startup uses google earth engine
  startup: async function (req, res, next) {
    var roiPath = "./cc_assets/Region_of_interest.geojson";
    var roiGeojson = await loadGeojson(roiPath);
    assets.roi = ee.FeatureCollection(roiGeojson);
  },
  loadPolygon: async function (req, res, next) {
    if (req.body.parentValues.length) {
      var rootDir = "./cc_assets";
      var dir = [rootDir];
      var parentName = req.body.parentValues.slice(-1);
      var scopes = await loadScopes("./cc_assets/bg_scopes.json");
      for (i = 0, len = req.body.parentValues.length; i < len; i++) {
        scopes = scopes[req.body.parentValues[i]];
        dir.push(scopes.pcode.slice(-2));
      }

      var parentCode = scopes.pcode;

      // build full path
      dir = dir.join("/");

      var childValues;
      var childSuffix;

      switch (req.body.polygonType) {
        case "countries":
          childValues = scopes["divisions"];
          childSuffix = "_divisions.geojson";
          break;
        case "divisions":
          childValues = scopes["zilas"];
          childSuffix = "_zilas.geojson";
          break;
        case "zilas":
          childValues = scopes["upazilas"];
          childSuffix = "_upazilas.geojson";
          break;
        case "upazilas":
          childValues = scopes["unions"];
          childSuffix = "_unions.geojson";
          break;
        case "unions":
          break;
      }

      var parentGeoJSON = await loadGeojson(
        [dir, parentName + ".geojson"].join("/")
      );
      if (!(req.body.polygonType == "unions")) {
        var childrenGeoJSON = await loadGeojson(
          [dir, parentCode + childSuffix].join("/")
        );
      }
      res.send({ parentGeoJSON, childrenGeoJSON, childValues });
    } else {
      var childrenGeoJSON = null;
      var childValues = null;
      res.send({ parentGeoJSON, childrenGeoJSON });
    }
  },
  loadTrainRoi: async function (req, res, next) {
    if (req.body.roiSource === "LSIB") {
      var dataset = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
      // Apply filter where country name equals Bangladesh.
      req.roi = dataset.filter(ee.Filter.eq("country_na", "Bangladesh"));
      req.roi.getMap({}, async ({}) => {
        next();
      });
    } else {
      var roiPath = "./cc_assets/BD/Bangladesh.geojson";
      // var roiPath = "./cc_assets/bg_boundary.geojson";
      // var roiPath = "./cc_assets/Region_of_interest.geojson";
      var roiGeojson = await loadGeojson(roiPath);
      req.roi = ee.FeatureCollection(roiGeojson);
      req.roi.getMap({}, async ({}) => {
        next();
      });
    }
  },
  loadTrainingPoints: async function (req, res, next) {
    var geoJSON = await csvToGeojson(req.body.csvData);
    geoJSON.features = shuffleArray(geoJSON.features);
    var split = Math.floor(
      (req.body.splitRatio * geoJSON.features.length) / 100
    );
    var tpGeojson = JSON.parse(JSON.stringify(geoJSON)),
      vpGeojson = JSON.parse(JSON.stringify(geoJSON));
    vpGeojson.features = JSON.parse(
      JSON.stringify(geoJSON.features.slice(split))
    );
    tpGeojson.features = JSON.parse(
      JSON.stringify(geoJSON.features.slice(0, split))
    );

    req.tp = ee.FeatureCollection(tpGeojson);
    req.vp = ee.FeatureCollection(vpGeojson);

    req.tp.getMap({}, async ({}) => {
      req.vp.getMap({}, async ({}) => {
        next();
      });
    });
  },
  displayTrainingPoints: async function (req, res, next) {
    var geoJSON = await csvToGeojson(req.body.csvData);
    geoJSON.features = shuffleArray(geoJSON.features);
    var split = Math.floor(
      (req.body.splitRatio * geoJSON.features.length) / 100
    );
    var tpGeojson = JSON.parse(JSON.stringify(geoJSON)),
      vpGeojson = JSON.parse(JSON.stringify(geoJSON));
    vpGeojson.features = JSON.parse(
      JSON.stringify(geoJSON.features.slice(split))
    );
    tpGeojson.features = JSON.parse(
      JSON.stringify(geoJSON.features.slice(0, split))
    );

    res.send({ tpGeojson, vpGeojson });
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
    // var start = ee.Date("2017-06-15");
    // var end = ee.Date("2017-10-15");
    var start = ee.Date(
      req.body.year + seasons[req.body.season].startDateSuffix
    );
    var end = ee.Date(req.body.year + seasons[req.body.season].endDateSuffix);

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

    // Extract band pixel values for validation points.
    var validation = imageCl
      .sampleRegions({
        collection: validationPts,
        properties: ["class"],
        scale: 30,
        tileScale: 8,
      })
      .filter(ee.Filter.neq("B1", null)); // Remove null pixels.

    // Classify the validation data.
    var validatedCart = validation.classify(trainedCart);
    var validatedRf = validation.classify(trainedRf);

    res.sendStatus(200);

    // console.log("starting the accuracy calculations" + startTime.toString());

    // // Training accuracy calculation
    // try {
    //   var trainAccuracyCart = await trainedCart
    //     .confusionMatrix()
    //     .accuracy()
    //     .getInfo((info) => {
    //       console.log("got train accuracy cart");
    //       return info;
    //     });
    //   var trainAccuracyRf = await trainedRf
    //     .confusionMatrix()
    //     .accuracy()
    //     .getInfo((info) => {
    //       console.log("got train accuracy rf");
    //       return info;
    //     });
    // } catch {
    //   console.log("Error while getting the confusion matrix.");
    // }

    // // Validation accuracy calculation
    // try {
    //   var validationAccuracyCart = await validatedCart
    //     .errorMatrix("class", "classification")
    //     .accuracy()
    //     .getInfo((info) => {
    //       console.log("got train val accuracy rf");
    //       return info;
    //     });
    //   var validationAccuracyRf = await validatedRf
    //     .errorMatrix("class", "classification")
    //     .accuracy()
    //     .getInfo((info) => {
    //       return info;
    //     });
    // } catch {
    //   console.log("Error while getting the confusion matrix.");
    // }

    // var resJSON = {};
    // resJSON.trainAccuracyCart = await trainAccuracyCart;
    // resJSON.trainAccuracyRf = await trainAccuracyRf;
    // resJSON.validationAccuracyCart = await validationAccuracyCart;
    // resJSON.validationAccuracyRf = await validationAccuracyRf;

    // // res.send(resJSON);
    // fs.writeFile(
    //   "./cc_assets/accuracies.json",
    //   // "./../rfExplanation.json",
    //   JSON.stringify(resJSON),
    //   (err) => {
    //     if (err) {
    //       console.log("Accuracy was not saved: ", err);
    //     }
    //     console.log("Accuracy has been saved!");
    //   }
    // );

    // console.log("saving the model");
    // // save RF trained models
    // try {
    //   var rfExplanation = await trainedRf.explain().getInfo((info) => {
    //     return info;
    //   });
    //   // console.log(explanation.numberOfTrees);
    //   fs.writeFile(
    //     "./cc_assets/rfExplanation.json",
    //     // "./../rfExplanation.json",
    //     JSON.stringify(rfExplanation),
    //     (err) => {
    //       if (err) {
    //         console.log("The Random Forest Explanation was not saved: ", err);
    //       }
    //       console.log("The Random Forest Explanation has been saved!");
    //     }
    //   );
    // } catch {
    //   console.log("Unable to get the Random Forest Explanation explanation.");
    // }

    // // save Cart trained models
    // try {
    //   var cartExplanation = await trainedCart.explain().getInfo((info) => {
    //     // console.log("pass");
    //     return info;
    //   });
    //   // console.log(explanation.numberOfTrees);
    //   fs.writeFile(
    //     "./cc_assets/cartExplanation.json",
    //     // "./../cartExplanation.json",
    //     JSON.stringify(cartExplanation),
    //     (err) => {
    //       if (err) {
    //         console.log("The CART Explanation was not saved: ", err);
    //       }
    //       console.log("The CART Explanation has been saved!");
    //     }
    //   );
    // } catch {
    //   console.log("Unable to get CART explanation.");
    // }

    // get training accuracy
    function getTrainingAccuracy(trainedClassifier) {
      return new Promise((resolve, reject) => {
        try {
          trainedClassifier
            .confusionMatrix()
            .accuracy()
            .getInfo((info) => {
              resolve(info);
            });
        } catch {
          console.log("unable to get trained accuracy");
        }
      });
    }

    // get validation accuracy
    function getValidationAccuracy(validatedClassifier) {
      return new Promise((resolve, reject) => {
        try {
          validatedClassifier
            .errorMatrix("class", "classification")
            .accuracy()
            .getInfo((info) => {
              resolve(info);
            });
        } catch {
          console.log("unable to get trained accuracy");
        }
      });
    }

    // get classifier explanation
    function getExplanation(trainedClassifier) {
      return new Promise((resolve, reject) => {
        try {
          trainedClassifier.explain().getInfo((info) => {
            resolve(info);
          });
        } catch {
          console.log("unable to get explanation");
        }
      });
    }

    async function getInfoParallel(arrayOfPromises) {
      return await Promise.all(arrayOfPromises);
    }

    var arrayOfResultsPromises = [
      getTrainingAccuracy(trainedCart), // cart training accuracy
      getTrainingAccuracy(trainedRf), // random forest training accuracy
      getValidationAccuracy(validatedCart), // cart validation accuracy
      getValidationAccuracy(validatedRf), // random forest validation accuracy
    ];

    // var startTime = new Date().getTime();
    var fulfilledResults = await getInfoParallel(arrayOfResultsPromises);

    var resJSON = {
      trainAccuracyCart: fulfilledResults[0],
      trainAccuracyRf: fulfilledResults[1],
      validationAccuracyCart: fulfilledResults[2],
      validationAccuracyRf: fulfilledResults[3],
    };

    // res.send(resJSON)

    // var endTime = new Date().getTime();
    // console.log("end time: " + endTime.toString(), fulfilledPromises);
    // console.log(endTime - startTime);
    // console.log(resJSON);

    // // res.send(resJSON);
    // fs.writeFile(
    //   "./cc_assets/trainResults.json",
    //   // "./../rfExplanation.json",
    //   JSON.stringify(resJSON),
    //   (err) => {
    //     if (err) {
    //       console.log("Results were not saved: ", err);
    //     }
    //     console.log("Results has been saved!");
    //   }
    // );

    req.app.locals.trainResults = JSON.parse(JSON.stringify(resJSON));

    var arrayOfExplanationsPromises = [
      getExplanation(trainedCart), // cart explanation
      getExplanation(trainedRf), //rf explanation
    ];

    var fulfilledExplanations = await getInfoParallel(
      arrayOfExplanationsPromises
    );

    fs.writeFile(
      `./cc_assets/models/cart_${req.body.season}.json`,
      // "./../cartExplanation.json",
      JSON.stringify(fulfilledExplanations[0]),
      (err) => {
        if (err) {
          console.log("The CART Explanation was not saved: ", err);
        }
        // console.log("The CART Explanation has been saved!");
      }
    );

    fs.writeFile(
      `./cc_assets/models/rf_${req.body.season}.json`,
      // "./../cartExplanation.json",
      JSON.stringify(fulfilledExplanations[1]),
      (err) => {
        if (err) {
          console.log("The Random Forest Explanation was not saved: ", err);
        }
        // console.log("The Random Forest Explanation has been saved!");
      }
    );

    // var endTime2 = new Date().getTime();
    // // console.log("end time: " + endTime.toString(), fulfilledPromises);
    // console.log(endTime2 - endTime);
  },
  scope: async function (req, res, next) {
    var scopes = await loadScopes("./cc_assets/bg_scopes.json");
    for (i = 0, len = req.body.parentValues.length; i < len; i++) {
      scopes = scopes[req.body.parentValues[i]];
    }
    var childValues = scopes[req.body.childKey];
    res.send({ childValues });
  },
  sendTrainResults: async function (req, res, next) {
    // var resultsData = await readFile("./cc_assets/trainResults.json");
    // var resultsDataJson = JSON.parse(resultsData);

    // console.log(resultsDataJson)
    // res.send(resultsDataJson);

    res.send(req.app.locals.trainResults);
  },
  laodClassifyRoi: async function (req, res, next) {
    // console.log(req.body.scope);
    switch (req.body.scope.type) {
      case "heirachyScope":
        // console.log("using the heirachy scope for classification");
        var rootDir = "./cc_assets";
        var dir = [rootDir];
        var scopes = await loadScopes("./cc_assets/bg_scopes.json");
        var geojsonName;
        for (i = 0, len = req.body.scope.tree.length; i < len; i++) {
          if (req.body.scope.tree[i]) {
            scopes = scopes[req.body.scope.tree[i]];
            dir.push(scopes.pcode.slice(-2));
            geojsonName = req.body.scope.tree[i];
          }
        }
        dir.push(`${geojsonName}.geojson`);
        // build full path
        dir = dir.join("/");
        // console.log(dir);

        if (geojsonName === "Bangladesh") {
          var dataset = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
          // Apply filter where country name equals Bangladesh.
          req.roi = dataset.filter(ee.Filter.eq("country_na", "Bangladesh"));
          req.roi.getMap({}, async ({}) => {
            next();
          });
        } else {
          var roiGeojson = await loadGeojson(dir);
          req.roi = ee.FeatureCollection(roiGeojson);
          req.roi.getMap({}, async ({}) => {
            next();
          });
        }

        break;
      case "drawScope":
        // console.log("using the draw scope for classification");

        next();
        break;
    }
  },
  loadClassifiedModel: async function (req, res, next) {
    var explanationPath = `./cc_assets/models/${req.body.classifier}_${req.body.season}.json`;
    // console.log(explanationPath);
    var trainedClassifier;
    try {
      var mlExplanationData = await readFile(explanationPath);
      var mlExplanationDataJson = JSON.parse(mlExplanationData);
      // console.log("Classes: ", mlExplanationDataJson.classes);
      switch (req.body.classifier) {
        case "rf":
          trainedClassifier = ee.Classifier.decisionTreeEnsemble(
            mlExplanationDataJson.trees
          );
          break;
        case "cart":
          trainedClassifier = ee.Classifier.decisionTree(
            mlExplanationDataJson.tree
          );
          break;
      }
      req.trainedClassifier = trainedClassifier;
    } catch {
      console.log("Error parsing JSON string");
    }
    next();
  },
  classify: async function (req, res, next) {
    // console.log("Running the classification from trained model");
    // var mlExplanationPath = "cc_assets/mlExplanation.json";
    // var trainedClassifier;
    // try {
    //   var mlExplanationData = await readFile(mlExplanationPath);
    //   var mlExplanationDataJson = JSON.parse(mlExplanationData);
    //   console.log("Number of trees: ", mlExplanationDataJson.numberOfTrees);
    // } catch {
    //   console.log("Error parsing JSON string");
    // }

    // console.log("classify post received");

    var roi = req.roi;

    // Import S2 TOA reflectance and corresponding cloud probability collections.
    var s2 = ee.ImageCollection("COPERNICUS/S2");
    var s2c = ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY");

    // Define dates over which to create a composite.
    // var start = ee.Date("2017-06-15");
    // var end = ee.Date("2017-10-15");

    // this section for effective seasonal classification based on dates
    var start = ee.Date(
      req.body.year + seasons[req.body.season].startDateSuffix
    );
    var end = ee.Date(req.body.year + seasons[req.body.season].endDateSuffix);

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

    // Classify the image with the same bands used for training.
    var classified = imageCl.select(bands).classify(req.trainedClassifier);

    // Define visualization parameters for classification display.
    var classVis = { min: 0, max: 1, palette: ["f2c649", "484848"] };

    classified.clipToCollection(roi).getMap(classVis, async ({ urlFormat }) => {
      // var tileUrl = await urlFormat;
      //   // response.send(urlFormat);
      // console.log(urlFormat);
      res.send({ urlFormat });
    });

    // console.log("classify post sent");
    // console.log(req.trainedClassifier.explain());

    // res.send({});
  },
};

module.exports = cc;
