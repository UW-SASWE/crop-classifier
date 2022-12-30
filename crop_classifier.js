var ee = require("@google/earthengine"); //earth engine module
require("dotenv").config();
var fs = require("fs");

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
        res.send(bgBoundaryDataJson);
      } catch {
        console.log("Error parsing JSON string");
      }
    })();
  },
  loadDivisions: async function (req, res, next) {
    var path = "./cc_assets/bg_divisions.geojson";
    (async function () {
      try {
        var bgBoundaryData = await readFile(path);
        var bgBoundaryDataJson = JSON.parse(bgBoundaryData);
        res.send(bgBoundaryDataJson);
      } catch {
        console.log("Error parsing JSON string");
      }
    })();
  },
  loadZilas: async function (req, res, next) {
    var path = "./cc_assets/bg_zilas.geojson";
    (async function () {
      try {
        var bgBoundaryData = await readFile(path);
        var bgBoundaryDataJson = JSON.parse(bgBoundaryData);
        res.send(bgBoundaryDataJson);
      } catch {
        console.log("Error parsing JSON string");
      }
    })();
  },
  loadUpazilas: async function (req, res, next) {
    var path = "./cc_assets/bg_upazilas.geojson";
    (async function () {
      try {
        var bgBoundaryData = await readFile(path);
        var bgBoundaryDataJson = JSON.parse(bgBoundaryData);
        res.send(bgBoundaryDataJson);
      } catch {
        console.log("Error parsing JSON string");
      }
    })();
  },
  loadUnions: async function (req, res, next) {
    var path = "./cc_assets/bg_unions.geojson";
    (async function () {
      try {
        var bgBoundaryData = await readFile(path);
        var bgBoundaryDataJson = JSON.parse(bgBoundaryData);
        res.send(bgBoundaryDataJson);
      } catch {
        console.log("Error parsing JSON string");
      }
    })();
  },
};

// cc.startup1()

module.exports = cc;
