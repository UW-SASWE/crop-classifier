const fs = require("fs");
const { parse } = require("csv-parse");

const csvToGeojson = (
  csvInput,
  records = [],
  geoJSON = { type: "FeatureCollection", features: [] }
) =>
  new Promise((resolve, reject) => {
    parse(csvInput, {
      trim: true,
      columns: true,
      skip_empty_lines: true,
    })
      .on("readable", function () {
        let record;
        while ((record = this.read()) !== null) {
          records.push(record);
        }
      })
      .on("end", () => {
        for (let i = 0, len = records.length; i < len; i++) {
          var pointData = records[i];
          geoJSON.features.push({
            geometry: {
              coordinates: [
                Number(pointData.Latitude),
                Number(pointData.Longitude),
              ],
              type: "Point",
            },
            id: i.toString(),
            properties: {
              crop_type: pointData.crop_type,
              class: Number(pointData.class),
            },
            type: "Feature",
          });
        }
        resolve(geoJSON);
      });
  });

// example usage of the csvToGeojson function
// var a = `
// Latitude,Longitude,class,crop_type
// 88.97475,24.10169444,1,rice
// 88.97511111,24.10736111,1,rice
// 88.96127778,24.09975,1,rice
// 88.97116667,24.09441667,1,rice
// 88.97116667,24.09441667,1,rice
// 88.95675,24.09191667,1,rice
// 90.58805556,24.47583333,1,rice
// 90.64916667,24.42055556,1,rice
// 90.66166667,24.41444444,1,rice
// 90.63111111,24.46305556,1,rice
// 90.62833333,24.45444444,1,rice
// 90.64861111,24.45027778,1,rice
// `;

// (async function () {
//   try {
//     var geoJSON = await csvToGeojson(a);
//     // console.log(geoJSON);
//     fs.writeFile(
//       "./sandbox.geojson",
//       JSON.stringify(geoJSON),
//       (err) => {
//         if (err) {
//           console.log("The file was not saved: ", err);
//         }
//         console.log("The file has been saved!");
//       }
//     );
//   } catch {
//     ("Diddn't work");
//   }
// })();

module.exports = csvToGeojson;
