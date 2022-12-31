const fs = require("fs");
const csvParser = require("csv-parser");

// var path = "./data.csv";

// const result = [];
// var geoJSON = { type: "FeatureCollection", features: [] };

const csvToGeojson = (
  path,
  result = [],
  geoJSON = { type: "FeatureCollection", features: [] }
) =>
  new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(csvParser())
      .on("data", (data) => {
        result.push(data);
      })
      .on("end", () => {
        for (let i = 0, len = result.length; i < len; i++) {
          var pointData = result[i];
          geoJSON.features.push({
            geometry: {
              coordinates: [Number(pointData.Latitude), Number(pointData.Longitude)],
              type: "Point",
            },
            id: i,
            properties: {
              class: pointData.class,
              classCode: pointData.classCode,
            },
            type: "Feature",
          });
        }
        resolve(geoJSON);
      });
  });

// example usage of the csvToGeojson function
(async function () {
  try {
    var geoJSON = await csvToGeojson("./cc_assets/training_points.csv");
    // console.log(geoJSON);
    fs.writeFile(
      "./cc_assets/training_points.geojson",
      JSON.stringify(geoJSON),
      (err) => {
        if (err) {
          console.log("The file was not saved: ", err);
        }
        console.log("The file has been saved!");
      }
    );
  } catch {
    ("Diddn't work");
  }
})();

module.exports = csvToGeojson;
