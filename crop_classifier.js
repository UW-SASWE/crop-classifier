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
  displayROI: function () {
    console.log("roi display function accessed correctly");
  },
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
    var response = {};

    (async function () {
      var bgBoundaryData = await readFile("./cc_assets/bg_boundary.geojson");
      var bgBoundaryDataJson = JSON.parse(bgBoundaryData);
      response.bg_boundary = bgBoundaryDataJson;
      
      res.send(response);
    })();
  },
  loadDivisions: async function (req, res, next) {
    var response = {};

    (async function () {
      var bgDivisionsData = await readFile("./cc_assets/bg_divisions.geojson");
      var bgDivisionsDataJson = JSON.parse(bgDivisionsData);
      response.bg_divisions = bgDivisionsDataJson;

      res.send(response);
    })();
  },
  loadZilas: async function (req, res, next) {
    var response = {};

    (async function () {
      var bgZilasData = await readFile("./cc_assets/bg_zilas.geojson");
      var bgZilasDataJson = JSON.parse(bgZilasData);
      response.bg_zilas = bgZilasDataJson;

      res.send(response);
    })();
  },
  loadUpazilas: async function (req, res, next) {
    var response = {};

    (async function () {
      var bgUpazilasData = await readFile("./cc_assets/bg_upazilas.geojson");
      var bgUpazilasDataJson = JSON.parse(bgUpazilasData);
      response.bg_upazilas = bgUpazilasDataJson;

      res.send(response);
    })();
  },
  loadUnions: async function (req, res, next) {
    var response = {};

    (async function () {
      
      var bgUnionsData = await readFile("./cc_assets/bg_unions.geojson");
      var bgUnionsDataJson = JSON.parse(bgUnionsData);
      response.bg_unions = bgUnionsDataJson;
      res.send(response);
    })();
  },
};

// cc.startup1()

module.exports = cc;
