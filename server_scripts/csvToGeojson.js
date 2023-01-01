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

// // example usage of the csvToGeojson function
// var a = `
// Latitude,Longitude,classCode,class
// 88.97475,24.10169444,1,rice
// 88.97511111,24.10736111,1,rice
// 88.96127778,24.09975,1,rice
// 88.97116667,24.09441667,1,rice
// 88.97116667,24.09441667,1,rice
// 88.95675,24.09191667,1,rice
// 88.96488889,24.1005,1,rice
// 88.96152778,24.09586111,1,rice
// 88.00277778,24.08097222,1,rice
// 88.99722222,24.08597222,1,rice
// 88.97475,24.04483333,1,rice
// 88.97005556,24.03694444,1,rice
// 88.98263889,24.01386111,1,rice
// 89.01161111,24.01480556,1,rice
// 89.01211111,24.03505556,1,rice
// 89.01211111,24.03502778,1,rice
// 88.99911111,24.03925,1,rice
// 88.99477778,24.03011111,1,rice
// 89.01188889,24.01916667,1,rice
// 88.98913889,24.024,1,rice
// `;
//
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
