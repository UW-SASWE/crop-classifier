var ee = require("@google/earthengine"); //earth engine module
require("dotenv").config();

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
  startup: async function (req, res, next) {
    var bg_boundary = ee
      .FeatureCollection("USDOS/LSIB_SIMPLE/2017")
      .filter(ee.Filter.eq("country_co", "BG"));

    var bg_feature = ee.Feature(bg_boundary.first());
    var bg_centroid = bg_feature.centroid().geometry().coordinates().getInfo();
    // console.log([bg_centroid[1], bg_centroid[0]]);
    var mapid = bg_feature.getMap({}, async ({ urlFormat }) => {
    //   console.log(urlFormat);
    //   console.log('me')

      var url = await urlFormat;
        res.send( { "urlFormat": urlFormat, "center": [bg_centroid[1], bg_centroid[0]] });
    //   return url;
    });
    // return { urlFormat: await mapid, center: [bg_centroid[1], bg_centroid[0]] };
  },
};

module.exports = cc;
