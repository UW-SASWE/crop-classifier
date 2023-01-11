// This script is used to separate the shapefiles into nested folders for easy transfer to client side

const fs = require("fs");
const csvToScope = require("./server_scripts/csvToScope");

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

(async function () {
  try {
    var counter = 0;

    // // country
    // var countryGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_boundary.geojson")
    // );
    // var divisionGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_divisions.geojson")
    // );

    // for (i = 0, l = countryGeoJSON.features.length; i < l; i++) {
    //   var country_name = countryGeoJSON.features[i].properties.ADM0_EN;
    //   var country_code = countryGeoJSON.features[i].properties.ADM0_PCODE;
    //   var featureGeoJSON = {};
    //   featureGeoJSON.type = countryGeoJSON.type;
    //   featureGeoJSON.name = country_name + "_boundary";
    //   featureGeoJSON.crs = countryGeoJSON.crs;
    //   var dir = `./cc_assets/${country_code}`;
    //   if (!fs.existsSync(dir)) {
    //     fs.mkdirSync(dir, { recursive: true });
    //   }

    //   featureGeoJSON.features = countryGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM0_PCODE == country_code
    //   );

    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${country_name}.geojson`,
    //     JSON.stringify(featureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //       counter+=1
    //       console.log(counter, "The file has been saved!");
    //     }
    //   );

    //   var childFeatureGeoJSON = {};
    //   childFeatureGeoJSON.type = divisionGeoJSON.type;
    //   childFeatureGeoJSON.name = country_name + "_divisions";
    //   childFeatureGeoJSON.crs = divisionGeoJSON.crs;

    //   childFeatureGeoJSON.features = divisionGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM0_PCODE == country_code
    //   );
    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${country_code}_divisions.geojson`,
    //     JSON.stringify(childFeatureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //     //   console.log("The file has been saved!");
    //     }
    //   );
    // }

    // // division
    // var divisionGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_divisions.geojson")
    // );
    // var zilaGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_zilas.geojson")
    // );
    
    // for (i = 0, l = divisionGeoJSON.features.length; i < l; i++) {
    //   var country_code = divisionGeoJSON.features[i].properties.ADM0_PCODE;
    //   var division_name = divisionGeoJSON.features[i].properties.ADM1_EN;
    //   var division_code = divisionGeoJSON.features[i].properties.ADM1_PCODE;
    //   var featureGeoJSON = {};
    //   featureGeoJSON.type = divisionGeoJSON.type;
    //   featureGeoJSON.name = division_name + "_boundary";
    //   featureGeoJSON.crs = divisionGeoJSON.crs;
    //   var dir = `./cc_assets/${country_code}/${division_code}`;
    //   if (!fs.existsSync(dir)) {
    //     fs.mkdirSync(dir, { recursive: true });
    //   }

    //   featureGeoJSON.features = divisionGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM1_PCODE == division_code
    //   );

    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${division_code}/${division_name}.geojson`,
    //     JSON.stringify(featureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //       counter+=1
    //       console.log(counter, "The file has been saved!");
    //     }
    //   );

    //   var childFeatureGeoJSON = {};
    //   childFeatureGeoJSON.type = zilaGeoJSON.type;
    //   childFeatureGeoJSON.name = division_name + "_zilas";
    //   childFeatureGeoJSON.crs = zilaGeoJSON.crs;

    //   childFeatureGeoJSON.features = zilaGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM1_PCODE == division_code
    //   );
    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${division_code}/${division_code}_zilas.geojson`,
    //     JSON.stringify(childFeatureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //     //   console.log("The file has been saved!");
    //     }
    //   );
    // }

    // // zila
    // var zilaGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_zilas.geojson")
    // );
    // var upazilaGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_upazilas.geojson")
    // );
    
    // for (i = 0, l = zilaGeoJSON.features.length; i < l; i++) {
    //   var country_code = zilaGeoJSON.features[i].properties.ADM0_PCODE;
    //   var division_code = zilaGeoJSON.features[i].properties.ADM1_PCODE;

    //   var zila_name = zilaGeoJSON.features[i].properties.ADM2_EN;
    //   var zila_code = zilaGeoJSON.features[i].properties.ADM2_PCODE;
    //   var featureGeoJSON = {};
    //   featureGeoJSON.type = zilaGeoJSON.type;
    //   featureGeoJSON.name = zila_name + "_boundary";
    //   featureGeoJSON.crs = zilaGeoJSON.crs;
    //   var dir = `./cc_assets/${country_code}/${division_code}/${zila_code}`;
    //   if (!fs.existsSync(dir)) {
    //     fs.mkdirSync(dir, { recursive: true });
    //   }

    //   featureGeoJSON.features = zilaGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM2_PCODE == zila_code
    //   );

    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${division_code}/${zila_code}/${zila_name}.geojson`,
    //     JSON.stringify(featureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //       counter+=1
    //       console.log(counter, "The file has been saved!");
    //     }
    //   );

    //   var childFeatureGeoJSON = {};
    //   childFeatureGeoJSON.type = upazilaGeoJSON.type;
    //   childFeatureGeoJSON.name = zila_name + "_upazilas";
    //   childFeatureGeoJSON.crs = upazilaGeoJSON.crs;

    //   childFeatureGeoJSON.features = upazilaGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM2_PCODE == zila_code
    //   );
    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${division_code}/${zila_code}/${zila_code}_upazilas.geojson`,
    //     JSON.stringify(childFeatureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //     //   console.log("The file has been saved!");
    //     }
    //   );
    // }

    // // upazila
    // var upazilaGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_upazilas.geojson")
    // );
    // var unionGeoJSON = JSON.parse(
    //   await readFile("./cc_assets/bg_unions.geojson")
    // );
    
    // for (i = 0, l = upazilaGeoJSON.features.length; i < l; i++) {
    //   var country_code = upazilaGeoJSON.features[i].properties.ADM0_PCODE;
    //   var division_code = upazilaGeoJSON.features[i].properties.ADM1_PCODE;
    //   var zila_code = upazilaGeoJSON.features[i].properties.ADM2_PCODE;

    //   var upazila_name = upazilaGeoJSON.features[i].properties.ADM3_EN;
    //   var upazila_code = upazilaGeoJSON.features[i].properties.ADM3_PCODE;
    //   var featureGeoJSON = {};
    //   featureGeoJSON.type = upazilaGeoJSON.type;
    //   featureGeoJSON.name = upazila_name + "_boundary";
    //   featureGeoJSON.crs = upazilaGeoJSON.crs;
    //   var dir = `./cc_assets/${country_code}/${division_code}/${zila_code}/${upazila_code}`;
    //   if (!fs.existsSync(dir)) {
    //     fs.mkdirSync(dir, { recursive: true });
    //   }

    //   featureGeoJSON.features = upazilaGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM3_PCODE == upazila_code
    //   );

    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${division_code}/${zila_code}/${upazila_code}/${upazila_name}.geojson`,
    //     JSON.stringify(featureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //       counter+=1
    //       console.log(counter, "The file has been saved!");
    //     }
    //   );

    //   var childFeatureGeoJSON = {};
    //   childFeatureGeoJSON.type = unionGeoJSON.type;
    //   childFeatureGeoJSON.name = upazila_name + "_unions";
    //   childFeatureGeoJSON.crs = unionGeoJSON.crs;

    //   childFeatureGeoJSON.features = unionGeoJSON.features.filter(
    //     (obj) => obj.properties.ADM3_PCODE == upazila_code
    //   );
    //   fs.writeFile(
    //     `./cc_assets/${country_code}/${division_code}/${zila_code}/${upazila_code}/${upazila_code}_unions.geojson`,
    //     JSON.stringify(childFeatureGeoJSON),
    //     (err) => {
    //       if (err) {
    //         console.log("The file was not saved: ", err);
    //       }
    //     //   console.log("The file has been saved!");
    //     }
    //   );
    // }

    // union
    var unionGeoJSON = JSON.parse(
      await readFile("./cc_assets/bg_unions.geojson")
    );

    for (i = 0, l = unionGeoJSON.features.length; i < l; i++) {
      var country_code = unionGeoJSON.features[i].properties.ADM0_PCODE;
      var division_code = unionGeoJSON.features[i].properties.ADM1_PCODE;
      var zila_code = unionGeoJSON.features[i].properties.ADM2_PCODE;
      var upazila_code = unionGeoJSON.features[i].properties.ADM3_PCODE;

      var union_name = unionGeoJSON.features[i].properties.ADM4_EN;
      var union_code = unionGeoJSON.features[i].properties.ADM4_PCODE;
      var featureGeoJSON = {};
      featureGeoJSON.type = unionGeoJSON.type;
      featureGeoJSON.name = union_name + "_boundary";
      featureGeoJSON.crs = unionGeoJSON.crs;
      var dir = `./cc_assets/${country_code}/${division_code}/${zila_code}/${upazila_code}/${union_code}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      featureGeoJSON.features = unionGeoJSON.features.filter(
        (obj) => obj.properties.ADM4_PCODE == union_code
      );

      fs.writeFile(
        `./cc_assets/${country_code}/${division_code}/${zila_code}/${upazila_code}/${union_code}/${union_name}.geojson`,
        JSON.stringify(featureGeoJSON),
        (err) => {
          if (err) {
            console.log("The file was not saved: ", err);
          }
          counter+=1
          console.log(counter, "The file has been saved!");
        }
      );
    }
  } catch {
    ("Failure");
  }
})();
